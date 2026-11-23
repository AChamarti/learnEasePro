# LearnEase Pro – Lesson video URL update

This update changes lesson video entry from local file upload to a URL field in Instructor Studio.

## What changed

- Instructors paste a YouTube, Vimeo or direct MP4/WebM/MOV URL when creating or editing a lesson.
- No video file download or Cloudinary video upload is required.
- YouTube links are converted to privacy-enhanced YouTube embed URLs on the student learning page.
- Vimeo links are converted to Vimeo embed URLs.
- Direct video file URLs use the browser's native video player.
- Course thumbnail and lesson resource uploads remain unchanged.

## Important

A video URL must be publicly accessible to the intended learners and allow embedding where applicable. Private or embedding-restricted YouTube/Vimeo videos will not play. Only use content you own or are authorised to share.

## Files changed

- `client/src/pages/ManageCourse.jsx`
- `client/src/pages/Learn.jsx`
- `README.md`

The existing database field `lessons[].videoUrl` is retained, so existing lesson records and course data do not require a MongoDB migration.
