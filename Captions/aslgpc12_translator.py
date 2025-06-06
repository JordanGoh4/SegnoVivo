import spacy

class ASLGPC12Translator:
    def __init__(self):
        self.nlp = spacy.load("en_core_web_sm")
        # Optional: override common mappings
        self.word_map = {
            "thank": "THANK-YOU",
            "name": "NAME",
            "hello": "HELLO",
            "watching": "WATCH",
            "is": "",       # dropped in gloss
            "a": "",
            "an": "",
            "the": "",
            "to": "",
            "for": "",
            "of": "",
            "be": "",
        }

    def to_gloss(self, sentence):
        doc = self.nlp(sentence)
        gloss_words = []

        for token in doc:
            word = token.lemma_.lower()

            # Skip auxiliary verbs, articles, prepositions
            if token.pos_ in {"AUX", "DET", "ADP", "CCONJ", "PUNCT"}:
                continue

            mapped = self.word_map.get(word, word.upper())
            if mapped:
                gloss_words.append(mapped)

        return " ".join(gloss_words)