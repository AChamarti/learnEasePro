import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight, Search } from 'lucide-react';
import api from '../api/http';
import { useAuth } from '../context/AuthContext';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/courses')
      .then(response => setCourses(response.data))
      .catch(() => setError('Unable to load courses. Check the API connection.'));

    if (user?.role === 'student') {
      api.get('/learning/mine')
        .then(response => setEnrollments(response.data))
        .catch(() => setEnrollments([]));
    } else {
      setEnrollments([]);
    }
  }, [user]);

  const enrollmentByCourse = new Map(
    enrollments
      .filter(item => item.course?._id)
      .map(item => [item.course._id, item])
  );

  const filtered = courses.filter(course =>
    `${course.title} ${course.category} ${course.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  function getCourseAction(course) {
    const enrollment = enrollmentByCourse.get(course._id);

    if (enrollment?.status === 'approved') {
      return { label: 'Continue learning', to: `/learn/${course._id}`, status: 'Enrolled' };
    }

    if (enrollment?.status === 'pending') {
      return { label: 'View request', to: `/courses/${course._id}`, status: 'Access pending' };
    }

    if (enrollment?.status === 'rejected') {
      return { label: 'View course', to: `/courses/${course._id}`, status: 'Request declined' };
    }

    return { label: 'View course', to: `/courses/${course._id}`, status: '' };
  }

  return (
    <div className="page-wrap">
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE COURSE CATALOGUE</div>
          <h1>Explore what you can <em>become.</em></h1>
          <p>Practical courses to help you move forward.</p>
        </div>
        <div className="search-box">
          <Search size={18} />
          <input
            placeholder="Search courses..."
            value={search}
            onChange={event => setSearch(event.target.value)}
          />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <div className="course-grid">
        {filtered.map(course => {
          const action = getCourseAction(course);

          return (
            <article className="course-card" key={course._id}>
              <Link
                className="course-cover course-cover-link"
                to={`/courses/${course._id}`}
                aria-label={`View ${course.title}`}
                style={course.thumbnailUrl
                  ? { backgroundImage: `linear-gradient(0deg,#102b3c55,#102b3c22),url(${course.thumbnailUrl})` }
                  : {}}
              >
                <span>{course.category}</span>
                <span className="cover-symbol">✳</span>
              </Link>

              <div className="course-body">
                <div className="course-meta">
                  <span>{course.level}</span>
                  <span>{course.price === 0 ? 'Free' : `£${Number(course.price || 0).toFixed(2)}`}</span>
                </div>

                <h3>
                  <Link className="course-title-link" to={`/courses/${course._id}`}>
                    {course.title}
                  </Link>
                </h3>
                <p>{course.subtitle || course.description}</p>

                <div className="course-bottom">
                  <span>By {course.instructor?.name || 'LearnEase instructor'}</span>
                  <Link to={`/courses/${course._id}`} aria-label={`View details for ${course.title}`}>
                    <ArrowUpRight size={18} />
                  </Link>
                </div>

                {user?.role === 'student' && (
                  <div className="course-card-action">
                    {action.status && (
                      <span className={`status status-${enrollmentByCourse.get(course._id)?.status || 'pending'}`}>
                        {action.status}
                      </span>
                    )}
                    <Link className="btn btn-primary btn-full" to={action.to}>
                      {action.label} <ArrowUpRight size={16} />
                    </Link>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {!filtered.length && !error && (
        <div className="empty-state">No courses found. Try another search.</div>
      )}
    </div>
  );
}

export function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    let active = true;

    api.get(`/courses/${id}`)
      .then(response => {
        if (active) setData(response.data);
      })
      .catch(() => {
        if (active) setMessage('Course not found. Please return to the course catalogue and try again.');
      });

    if (user?.role === 'student') {
      api.get('/learning/mine')
        .then(response => {
          if (!active) return;
          const found = response.data.find(item => item.course?._id === id);
          setEnrollment(found || null);
        })
        .catch(() => {
          if (active) setEnrollment(null);
        });
    } else {
      setEnrollment(null);
    }

    return () => {
      active = false;
    };
  }, [id, user]);

  const enrol = async () => {
    try {
      const response = await api.post(`/courses/${id}/enrol`);
      setEnrollment(response.data);
      setMessage(`Your access request is ${response.data.status}. An administrator will review it.`);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Please log in as a student to request access.');
    }
  };

  const pay = async () => {
    try {
      const response = await api.post(`/payments/checkout/${id}`);
      window.location.assign(response.data.url);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Unable to start checkout.');
    }
  };

  const review = async event => {
    event.preventDefault();
    try {
      await api.post(`/courses/${id}/reviews`, {
        rating: Number(rating),
        comment
      });
      const response = await api.get(`/courses/${id}`);
      setData(response.data);
      setMessage('Thank you for reviewing this course.');
      setComment('');
    } catch (error) {
      setMessage(error.response?.data?.message || 'You must have approved access to review this course.');
    }
  };

  if (!data) {
    return (
      <div className="page-wrap">
        <p>{message || 'Loading course...'}</p>
        <Link className="btn btn-light" to="/courses">Back to courses</Link>
      </div>
    );
  }

  const course = data.course;
  const isApproved = enrollment?.status === 'approved';
  const isPending = enrollment?.status === 'pending';
  const isRejected = enrollment?.status === 'rejected';

  return (
    <div className="page-wrap detail-layout">
      <div>
        <div className="eyebrow">{course.category} · {course.level}</div>
        <h1>{course.title}</h1>
        <p className="detail-subtitle">{course.subtitle || course.description}</p>
        <div
          className="detail-cover"
          style={course.thumbnailUrl
            ? { backgroundImage: `linear-gradient(0deg,#102b3c55,#102b3c22),url(${course.thumbnailUrl})` }
            : {}}
        >
          <span>LEARN BY DOING</span>
        </div>

        <h2>About this course</h2>
        <p>{course.description}</p>
        <h2>Course curriculum</h2>
        {course.lessons?.length
          ? course.lessons.map((lesson, index) => (
            <div className="lesson-item" key={lesson._id || index}>
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <b>{lesson.title}</b>
                <small>{lesson.durationMinutes || 0} min</small>
              </div>
            </div>
          ))
          : <p>Lessons will be added by the instructor.</p>}

        <h2>Student reviews</h2>
        {data.reviews?.length
          ? data.reviews.map(reviewItem => (
            <div className="review" key={reviewItem._id}>
              <b>{reviewItem.student?.name}</b>
              <span>{'★'.repeat(reviewItem.rating)}</span>
              <p>{reviewItem.comment}</p>
            </div>
          ))
          : <p>No reviews yet.</p>}

        {user?.role === 'student' && isApproved && (
          <form className="editor-form lesson-editor" onSubmit={review}>
            <h3>Leave a review</h3>
            <label className="field">
              <span>Rating</span>
              <select value={rating} onChange={event => setRating(event.target.value)}>
                {[5, 4, 3, 2, 1].map(number => (
                  <option key={number} value={number}>{number} star{number > 1 ? 's' : ''}</option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Your feedback</span>
              <textarea value={comment} onChange={event => setComment(event.target.value)} maxLength="1000" />
            </label>
            <button className="btn btn-light">Submit review</button>
          </form>
        )}
      </div>

      <aside className="enrol-card">
        <div className="eyebrow">START LEARNING</div>
        <div className="price">{course.price === 0 ? 'Free' : `£${Number(course.price || 0).toFixed(2)}`}</div>
        <p>{course.price > 0
          ? 'Secure checkout by card. Access is enabled automatically after confirmed payment.'
          : 'Request access to this free course. An administrator will review your request.'}</p>

        {user?.role === 'student' ? (
          isApproved ? (
            <>
              <span className="status status-approved">Enrolled · Access approved</span>
              <Link className="btn btn-primary btn-full" to={`/learn/${course._id}`}>
                Continue learning <ArrowUpRight size={17} />
              </Link>
            </>
          ) : isPending ? (
            <div className="notice">Your access request is pending administrator approval. You'll be able to watch lessons once it is approved.</div>
          ) : isRejected ? (
            <div className="notice">Your previous access request was declined. Please contact the course administrator for assistance.</div>
          ) : course.price > 0 ? (
            <button className="btn btn-primary btn-full" onClick={enrol}>Enrol</button>
          ) : (
            <button className="btn btn-primary btn-full" onClick={enrol}>Request course access</button>
          )
        ) : (
          <p className="muted">Log in as a student to enrol.</p>
        )}

        {message && <p className="notice">{message}</p>}
        <div className="instructor-info">
          <small>YOUR INSTRUCTOR</small>
          <b>{course.instructor?.name || 'LearnEase instructor'}</b>
        </div>
        <Link className="btn btn-light btn-full course-back-link" to="/courses">Back to all courses</Link>
      </aside>
    </div>
  );
}
