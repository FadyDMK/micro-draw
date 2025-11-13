const WORDS = [
    'apple','banana','cat','dog','house','tree','car','plane','star','moon',
    'robot','pizza','guitar','phone','computer','flower','bicycle','mountain','river','beach',
    'sun','rainbow','lion','turtle','dragon','castle','rocket','camera','book','bread'
];

function getRandomWord(usedWords = []) {
    const available = WORDS.filter(word => !usedWords.includes(word));
    if (available.length === 0) {
        // Reset if we run out of words
        return WORDS[Math.floor(Math.random() * WORDS.length)];
    }
    const index = Math.floor(Math.random() * available.length);
    return available[index];
}

module.exports = {
    getRandomWord
};
