import cv2
import os

# Used to create map previews from a video (just record a section of map and swap to all avaiable layers)

cap = cv2.VideoCapture("map-previews/Screen Recording 2025-08-11 214607.mp4")
frame_count = 0

while True:
    ret, frame = cap.read()
    if not ret:
        break
    cv2.imwrite(f"map-previews/{frame_count}.jpg", frame)
    frame_count += 1

cap.release()