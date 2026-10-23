import { cloudFrame, cloudVideo, FOOTAGE, ik } from '../cdn'

// Clips and captions for the cinematic VideoStrip. ROAD runs on the home
// page, SKYLINE on About.
export const ROAD = {
  src: cloudVideo(FOOTAGE.road),
  poster: ik('site/video-poster.jpg', 'w-1600'),
  alt: 'Monochrome aerial drone footage tracking traffic along a main road through a residential area',
  badge: 'FLIGHT CAM 04 // ACTIVE RUN',
  title: 'HIGH-ENDURANCE FIELD RECONNAISSANCE',
  head: '01 — AERIAL SYSTEMS',
  sub: 'Professional UAV platforms for practical deployment.',
  meta: 'FLIGHT DURATION: 01:42:19 · AUTONOMY: LVL 4',
  meta2: ['▪ ALT: 120M', ' · VEL: 14.2 M/S · SENSORS: ACTIVE'],
}

export const SKYLINE = {
  src: cloudVideo(FOOTAGE.skyline),
  poster: cloudFrame(FOOTAGE.skyline, 1),
  alt: 'Monochrome aerial drone footage rising over a city towards the horizon',
  badge: 'FLIGHT CAM 02 // ALTITUDE CLIMB',
  title: 'THE VIEW FROM ABOVE',
  head: '02 — PERSPECTIVE',
  sub: 'Seeing a whole site, a whole city, in one frame.',
  meta: 'MAPPING · INSPECTION · AERIAL MEDIA',
  meta2: ['▪ ALT: 120M', ' · CAMERA: STABILISED'],
}
