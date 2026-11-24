import { useState } from 'react';

export default function CourseThumbnail({ src, alt = 'Course thumbnail' }) {
  const [failed, setFailed] = useState(false);
  return src && !failed ? (
    <img className="course-thumbnail-image" src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} />
  ) : <span className="course-thumbnail-fallback" aria-label="Course image unavailable">✳</span>;
}
