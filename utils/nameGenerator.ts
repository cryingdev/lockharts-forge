import { JobClass } from "../models/JobClass";
import { FIRST_NAMES, LAST_NAMES } from "../data/nameData";
import { Gender } from "../models/Mercenary";

export const generateFullName = (gender: Gender, job: JobClass): string => {
  const firstNames = FIRST_NAMES[gender][job];
  const lastNames = LAST_NAMES[job];

  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

  return `${firstName} ${lastName}`;
};
