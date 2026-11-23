import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/http';

function getVideoEmbed(rawUrl) {
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, '').toLowerCase();

    if (host === 'youtu.be' || ['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) {
      let videoId = '';

      if (host === 'youtu.be') {
        videoId = url.pathname.split('/').filter(Boolean)[0] || '';
      } else if (url.pathname === '/watch') {
        videoId = url.searchParams.get('v') || '';
      } else {
        const parts = url.pathname.split('/').filter(Boolean);
        if (['embed', 'shorts', 'live', 'v'].includes(parts[0])) videoId = parts[1] || '';
      }

      if (/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
        return { type: 'embed', url: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0` };
      }
    }

    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const match = url.pathname.match(/(?:video\/)?(\d+)/);
      if (match) return { type: 'embed', url: `https://player.vimeo.com/video/${match[1]}` };
    }

    if (['http:', 'https:'].includes(url.protocol)) {
      return { type: 'direct', url: rawUrl.trim() };
    }
  } catch {
    return null;
  }

  return null;
}

export default function Learn() {
  const { id } = useParams();
  const [enrol, setEnrol] = useState(null);
  const [selected, setSelected] = useState(0);
  const [message, setMessage] = useState('');
  const [quizzes, setQuizzes] = useState([]);
  const [active, setActive] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.get('/learning/mine')
      .then((response) => {
        const found = response.data.find((item) => item.course?._id === id);
        setEnrol(found || null);
      })
      .catch(() => setMessage('Unable to load course'));

    api.get(`/quizzes/course/${id}`)
      .then((response) => setQuizzes(response.data))
      .catch(() => {});
  }, [id]);

  if (!enrol) return <div className="page-wrap">{message || 'Loading your course...'}</div>;
  if (enrol.status !== 'approved') return <div className="page-wrap">Your course access is not approved yet.</div>;

  const lessons = enrol.course.lessons || [];
  const lesson = lessons[selected];
  const video = getVideoEmbed(lesson?.videoUrl);

  const complete = async () => {
    try {
      const response = await api.patch(`/learning/${enrol._id}/lessons/${lesson._id}/complete`);
      setEnrol({ ...enrol, completedLessons: response.data.completedLessons });
      setMessage('Lesson marked as complete.');
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to update progress');
    }
  };

  const startQuiz = (quiz) => {
    setActive(quiz);
    setAnswers(quiz.questions.map(() => -1));
    setResult(null);
  };

  const submitQuiz = async (event) => {
    event.preventDefault();

    try {
      const response = await api.post(`/quizzes/${active._id}/attempts`, { answers });
      setResult(response.data);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to submit quiz');
    }
  };

  return (
    <div className="page-wrap">
      <div className="learn-layout">
        <div>
          <div className="eyebrow">MY CLASSROOM</div>
          <h1>{enrol.course.title}</h1>

          <div className="video-panel">
            {!lesson?.videoUrl ? (
              <div className="video-placeholder">No video link has been added for this lesson yet.</div>
            ) : !video ? (
              <div className="video-placeholder">This video link is invalid or unsupported. Please contact your instructor.</div>
            ) : video.type === 'embed' ? (
              <iframe
                className="youtube-player"
                src={video.url}
                title={lesson.title || 'Course lesson video'}
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <video controls playsInline preload="metadata" src={video.url} controlsList="nodownload" />
            )}
          </div>

          <h2>{lesson?.title || 'No lessons added yet'}</h2>
          <p>{lesson?.description}</p>
          {lesson?.resourceUrl && (
            <a className="btn btn-light" href={lesson.resourceUrl} target="_blank" rel="noreferrer" download>
              Download lesson resource
            </a>
          )}

          <div className="lesson-actions">
            <button
              className="btn btn-primary"
              disabled={!lesson || enrol.completedLessons.some((item) => item === lesson._id)}
              onClick={complete}
            >
              Mark lesson completed
            </button>
            {message && <span className="notice">{message}</span>}
          </div>

          <div className="lesson-editor">
            <h3>Knowledge checks</h3>
            {quizzes.map((quiz) => (
              <div className="lesson-item" key={quiz._id}>
                <div>
                  <b>{quiz.title}</b>
                  <small>{quiz.questions.length} questions · Pass mark {quiz.passMark}%</small>
                </div>
                <button className="btn btn-light btn-small" onClick={() => startQuiz(quiz)}>Take quiz</button>
              </div>
            ))}
            {!quizzes.length && <p className="muted">No quizzes have been published for this course yet.</p>}
          </div>

          {active && (
            <form className="editor-form lesson-editor" onSubmit={submitQuiz}>
              <h2>{active.title}</h2>
              <p>{active.description}</p>
              {active.questions.map((question, questionIndex) => (
                <fieldset className="quiz-question" key={question._id}>
                  <legend>{questionIndex + 1}. {question.prompt}</legend>
                  {question.options.map((option, optionIndex) => (
                    <label className="check-field" key={optionIndex}>
                      <input
                        type="radio"
                        name={`q-${questionIndex}`}
                        checked={answers[questionIndex] === optionIndex}
                        onChange={() => setAnswers((current) => current.map((value, index) => index === questionIndex ? optionIndex : value))}
                      />
                      {option}
                    </label>
                  ))}
                </fieldset>
              ))}

              {result ? (
                <div className="notice">
                  <h3>{result.passed ? 'You passed!' : 'Quiz submitted'}</h3>
                  <p>Your score: {result.score}% · Required: {result.passMark}%</p>
                  {result.review.map((item, index) => (
                    <p key={index}>Question {index + 1}: {item.selectedIndex === item.correctIndex ? 'Correct' : 'Incorrect'} {item.explanation && `— ${item.explanation}`}</p>
                  ))}
                  <button type="button" className="btn btn-light" onClick={() => setActive(null)}>Close</button>
                </div>
              ) : (
                <>
                  <button className="btn btn-primary" disabled={answers.some((answer) => answer < 0)}>Submit answers</button>
                  <button type="button" className="btn btn-light" onClick={() => setActive(null)}>Cancel</button>
                </>
              )}
            </form>
          )}

          <Link className="btn btn-light" to={`/discussions/${id}`}>Open course group chat</Link>
        </div>

        <aside className="curriculum">
          <h3>Course content</h3>
          <p>{enrol.completedLessons.length} of {lessons.length} completed</p>
          <div className="progress-track">
            <i style={{ width: `${lessons.length ? enrol.completedLessons.length / lessons.length * 100 : 0}%` }} />
          </div>
          {lessons.map((item, index) => (
            <button className={`curriculum-item ${selected === index ? 'selected' : ''}`} key={item._id} onClick={() => setSelected(index)}>
              <span>{enrol.completedLessons.some((completedId) => completedId === item._id) ? '✓' : String(index + 1).padStart(2, '0')}</span>
              <b>{item.title}</b>
            </button>
          ))}
        </aside>
      </div>
    </div>
  );
}
