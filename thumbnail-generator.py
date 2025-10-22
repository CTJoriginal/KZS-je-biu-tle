import cv2
import os
import json
import re
import requests
from datetime import datetime
import locale

locale.setlocale(locale.LC_TIME, "sl_SI.UTF-8")


media_dir = "images"

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


def reverse_geocode(lat, lon):
    url = f"https://nominatim.openstreetmap.org/reverse?format=json&lat={lat}&lon={lon}"
    headers = {"User-Agent": "python-geocoder"}

    response = requests.get(url, headers=headers)
    data = response.json()
    
    address = data['address']
    city = address.get('city') or address.get('town') or address.get('village')
    
    return f"{city}, {address.get('country', '')}"

with open("images.json", "r", encoding="utf8") as json_doc:
    data = json.load(json_doc)

data_indexes = [re.findall(r"\d+", d["path"])[0] for d in data]

for media_path in os.listdir(media_dir):
    media_index = re.findall(r"\d+", media_path)[0] # Index in name of file
    thumbnail_path = ""
    
    if media_path.lower().endswith((".mp4", ".avi", ".mov", ".mkv", ".webm")):
        video_path = os.path.join(media_dir, media_path)
        base_name = os.path.splitext(media_path)[0]
        thumbnail_path = os.path.join(media_dir, base_name + ".jpg")

        if not os.path.exists(thumbnail_path):
            generate_thumbnail(video_path, thumbnail_path)


    if not media_index in data_indexes:
        print(f"added {media_path}")
        data_indexes.append(media_index)
        data.append({
            "path": os.path.join(media_dir, media_path),
            "coordinates": "",
            "description": "",
            "city": "",
            "dateTime": datetime.now().strftime("%B %Y").capitalize()
        })
        
for media in data:
    if media["coordinates"] != "" and media["city"] == "":
        lat, lon = media["coordinates"].split(",")
        media["city"] = reverse_geocode(lat, lon)
        
data.sort(key = lambda f: int(re.findall(r"\d+", f["path"])[0]))

with open("images.json", "w", encoding="utf8") as f:
    json.dump(data, f, indent=4, ensure_ascii=False)