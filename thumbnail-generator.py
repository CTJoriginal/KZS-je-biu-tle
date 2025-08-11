import cv2
import os

def generate_thumbnail(video_path, thumbnail_path, width=320):
    cap = cv2.VideoCapture(video_path)
    success, frame = cap.read()
    if not success:
        print(f"Failed to read video: {video_path}")
        return False
    
    # Resize frame to given width, keep aspect ratio
    height = int(frame.shape[0] * (width / frame.shape[1]))
    frame_resized = cv2.resize(frame, (width, height))

    # Save as JPEG
    cv2.imwrite(thumbnail_path, frame_resized)
    print(f"Thumbnail saved to {thumbnail_path}")
    cap.release()
    return True


video_dir = "images"
for file in os.listdir(video_dir):
    if file.lower().endswith(('.mp4', '.avi', '.mov', '.mkv', '.webm')):
        video_path = os.path.join(video_dir, file)
        base_name = os.path.splitext(file)[0]
        thumbnail_path = os.path.join(video_dir, base_name + ".jpg")

        if not os.path.exists(thumbnail_path):
            generate_thumbnail(video_path, thumbnail_path)
