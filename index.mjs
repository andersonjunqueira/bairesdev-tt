import * as fn from './functions.mjs';

const token = 'Bearer <token>';
const date = new Date(2023, 1, 1);
fn.loadTT('./current.txt', date, token);









