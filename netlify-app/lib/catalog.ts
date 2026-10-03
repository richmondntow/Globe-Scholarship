import records from '../data/scholarships.json';
export type Scholarship = typeof records[number];
export const scholarships = records;
export const destinations = [...new Set(records.flatMap(x => 'countries' in x && x.countries ? x.countries : [x.country]))].sort();
export const levels = ['Undergraduate', 'Master’s', 'PhD'];
