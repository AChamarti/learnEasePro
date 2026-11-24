import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api, { resolveMediaUrl } from '../api/http';

const blank = {
  title: '', subtitle: '', description: '', category: 'Web Development',
  level: 'Beginner', price: 0, thumbnailUrl: '', published: false, lessons: []
};

function getVideoProvider(rawUrl) {
  if (!rawUrl?.trim()) return null;
  try {
    const url = new URL(rawUrl.trim());
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host === 'youtu.be' || ['youtube.com', 'm.youtube.com', 'youtube-nocookie.com'].includes(host)) return 'YouTube';
    if (host === 'vimeo.com' || host === 'player.vimeo.com') return 'Vimeo';
    if (['http:', 'https:'].includes(url.protocol) && /\.(mp4|webm|mov)(\?.*)?$/i.test(url.pathname + url.search)) return 'Direct video URL';
  } catch { return null; }
  return null;
}

export default function ManageCourse() {
  const { id } = useParams();
  const nav = useNavigate();
  const [form, setForm] = useState(blank);
  const [lesson, setLesson] = useState({ title: '', description: '', videoUrl: '', durationMinutes: 0 });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (id) api.get(`/courses/${id}`).then(response => setForm(response.data.course)).catch(() => setMessage('Could not load course'));
  }, [id]);

  const update = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const addLesson = () => {
    if (!lesson.title.trim()) return setMessage('Please enter a lesson title.');
    if (lesson.videoUrl.trim() && !getVideoProvider(lesson.videoUrl)) return setMessage('Enter a valid YouTube, Vimeo or direct MP4/WebM/MOV video URL.');
    setForm(current => ({ ...current, lessons: [...(current.lessons || []), { ...lesson, order: (current.lessons || []).length }] }));
    setLesson({ title: '', description: '', videoUrl: '', durationMinutes: 0 });
    setMessage('Lesson added. Remember to save the course.');
  };

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try {
      const response = id ? await api.patch(`/courses/${id}`, form) : await api.post('/courses', form);
      setMessage('Course saved successfully.');
      if (!id) nav(`/manage-course/${response.data._id}`, { replace: true });
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to save course');
    } finally { setBusy(false); }
  };

  const videoProvider = getVideoProvider(lesson.videoUrl);

  return (
    <div className="page-wrap narrow">
      <div className="eyebrow">INSTRUCTOR STUDIO</div>
      <h1>{id ? 'Edit course' : 'Create a course'}</h1>
      <p className="muted">Add course details and paste hosted image and lesson video URLs. LearnEase Pro stores the URLs, not the files.</p>
      <form className="editor-form" onSubmit={submit}>
        <label className="field"><span>Course title</span><input required value={form.title} onChange={event => update('title', event.target.value)} /></label>
        <label className="field"><span>Short subtitle</span><input value={form.subtitle || ''} onChange={event => update('subtitle', event.target.value)} /></label>
        <label className="field"><span>Description</span><textarea required rows="5" value={form.description} onChange={event => update('description', event.target.value)} /></label>
        <div className="two-fields">
          <label className="field"><span>Category</span><select value={form.category} onChange={event => update('category', event.target.value)}>{['Web Development', 'Data Science', 'Cybersecurity', 'Cloud Computing', 'AI & Machine Learning', 'Programming', 'Design'].map(item => <option key={item}>{item}</option>)}</select></label>
          <label className="field"><span>Level</span><select value={form.level} onChange={event => update('level', event.target.value)}>{['Beginner', 'Intermediate', 'Advanced'].map(item => <option key={item}>{item}</option>)}</select></label>
        </div>
        <div className="two-fields">
          <label className="field"><span>Price (£)</span><input type="number" min="0" step="0.01" value={form.price} onChange={event => update('price', Number(event.target.value))} /></label>
          <label className="field"><span>Course thumbnail URL</span><input type="url" placeholder="https://… (public Vercel Blob or image URL)" value={form.thumbnailUrl || ''} onChange={event => update('thumbnailUrl', event.target.value)} /><small className="muted">Upload the image to Vercel Blob or another image host, then paste its public HTTPS URL here.</small></label>
        </div>
        {form.thumbnailUrl && <img src={resolveMediaUrl(form.thumbnailUrl)} alt="Course thumbnail preview" style={{ width: 180, borderRadius: 12 }} />}
        <div className="lesson-editor">
          <h3>Course lessons</h3>
          {form.lessons?.map((item, index) => <div className="lesson-item" key={item._id || index}><span>{index + 1}</span><div><b>{item.title}</b>{item.videoUrl && <small>{getVideoProvider(item.videoUrl) || 'Video link added'}</small>}</div><button type="button" className="text-button" onClick={() => update('lessons', form.lessons.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></div>)}
          <div className="lesson-fields">
            <label className="field"><span>Lesson title</span><input placeholder="e.g. Introduction to React" value={lesson.title} onChange={event => setLesson({ ...lesson, title: event.target.value })} /></label>
            <label className="field"><span>Lesson description</span><textarea placeholder="What will students learn in this lesson?" value={lesson.description} onChange={event => setLesson({ ...lesson, description: event.target.value })} /></label>
            <label className="field"><span>Video URL (YouTube, Vimeo or direct video link)</span><input type="url" placeholder="https://www.youtube.com/watch?v=…" value={lesson.videoUrl} onChange={event => setLesson({ ...lesson, videoUrl: event.target.value })} /><small className="muted">Paste a share link. The video remains hosted by your video provider.</small></label>
            {lesson.videoUrl && <p className={videoProvider ? 'notice' : 'notice notice-error'}>{videoProvider ? `${videoProvider} link recognised.` : 'This link is not recognised. Use a YouTube, Vimeo or direct MP4/WebM/MOV URL.'}</p>}
            <label className="field"><span>Duration (minutes)</span><input type="number" min="0" placeholder="Duration in minutes" value={lesson.durationMinutes} onChange={event => setLesson({ ...lesson, durationMinutes: Number(event.target.value) })} /></label>
            <button type="button" className="btn btn-light" onClick={addLesson}>Add lesson</button>
          </div>
        </div>
        <label className="check-field"><input type="checkbox" checked={!!form.published} onChange={event => update('published', event.target.checked)} />Publish course so students can discover it</label>
        {message && <p className="notice">{message}</p>}
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save course'}</button>
        {id && <Link className="btn btn-light" to={`/manage-course/${id}/quizzes`}>Manage quizzes</Link>}
      </form>
    </div>
  );
}
