const fs = require('fs');
const src = fs.readFileSync('/Users/arunkumarg/loudooh/index.html', 'utf8');
const lines = src.split('\n');
const terms = ['Canberra', 'Sydney', 'Skyline', 'mude', 'Mude', 'open rates', 'open-rate', 'Optimize', 'Rapid deployment', 'Mood on the Roof', 'Building the brands'];
for (const t of terms) {
  console.log('== ' + t + ' ==');
  lines.forEach((ln, i) => {
    let idx = 0; let count = 0;
    while ((idx = ln.indexOf(t, idx)) !== -1 && count < 6) {
      const ctx = ln.slice(Math.max(0, idx - 90), idx + t.length + 90).replace(/\s+/g, ' ');
      console.log(`  L${i + 1}@${idx}: …${ctx}…`);
      idx += t.length; count++;
    }
    if (count >= 6) {
      let rest = 0; let j = idx;
      while ((j = ln.indexOf(t, j)) !== -1) { rest++; j += t.length; }
      if (rest) console.log(`  L${i + 1}: (+${rest} more on this line)`);
    }
  });
}
