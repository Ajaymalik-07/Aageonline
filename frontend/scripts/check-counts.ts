import { JAIPUR_EDITORIAL_CONTENT } from '../data/markets/jaipur-interior-designers-content.ts';
import { DELHI_EDITORIAL_CONTENT } from '../data/markets/delhi-interior-designers-content.ts';
import { MUMBAI_EDITORIAL_CONTENT } from '../data/markets/mumbai-interior-designers-content.ts';
import { JAIPUR_RESTAURANTS_CONTENT } from '../data/markets/jaipur-restaurants-content.ts';
import { DELHI_RESTAURANTS_CONTENT } from '../data/markets/delhi-restaurants-content.ts';
import { MUMBAI_RESTAURANTS_CONTENT } from '../data/markets/mumbai-restaurants-content.ts';

function countWords(str: string): number {
  return str.trim().split(/\s+/).filter(Boolean).length;
}

function calcTotalWords(content: any[]): number {
  let totalWords = 0;
  content.forEach((sec) => {
    totalWords += countWords(sec.heading);
    if (sec.subheading) totalWords += countWords(sec.subheading);
    if (sec.intro) totalWords += countWords(sec.intro);
    sec.paragraphs.forEach((p: string) => {
      totalWords += countWords(p);
    });
    if (sec.directAnswer) {
      totalWords += countWords(sec.directAnswer.question);
      totalWords += countWords(sec.directAnswer.answer);
    }
    if (sec.subsections) {
      sec.subsections.forEach((sub: any) => {
        totalWords += countWords(sub.title);
        sub.content.forEach((p: string) => {
          totalWords += countWords(p);
        });
        if (sub.bulletPoints) {
          sub.bulletPoints.forEach((b: string) => {
            totalWords += countWords(b);
          });
        }
        if (sub.callout) {
          totalWords += countWords(sub.callout.title);
          totalWords += countWords(sub.callout.body);
        }
      });
    }
  });
  return totalWords;
}

console.log('Jaipur Interior Designers:', calcTotalWords(JAIPUR_EDITORIAL_CONTENT));
console.log('Delhi Interior Designers:', calcTotalWords(DELHI_EDITORIAL_CONTENT));
console.log('Mumbai Interior Designers:', calcTotalWords(MUMBAI_EDITORIAL_CONTENT));
console.log('Jaipur Restaurants:', calcTotalWords(JAIPUR_RESTAURANTS_CONTENT));
console.log('Delhi Restaurants:', calcTotalWords(DELHI_RESTAURANTS_CONTENT));
console.log('Mumbai Restaurants:', calcTotalWords(MUMBAI_RESTAURANTS_CONTENT));
