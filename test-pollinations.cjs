const https = require('https');

const url = 'https://text.pollinations.ai/sadkjaskdl?system=You+are+Ministry+AI.+Lang%3A+ru.+%0A++++++++Tone%3A+Formal+Ministry+official+mixed+with+witty%2C+dry+humor.%0A++++++++Context%3A+Honkai%3A+Star+Rail+universe.+Use+technical+terms.+%0A++++++++Occasionally+mention+Aeons+or+Stellarons+with+sarcasm.&model=openai&seed=539983';

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Body:', data);
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});
