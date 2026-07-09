// In-memory mock of the Newsletter model for testing the subscribe controller
// without a live MongoDB connection.

const store = [];

class NewsletterDoc {
  constructor(data) {
    Object.assign(this, data);
    if (!this.status) this.status = "active";
  }
  async save() {
    const existing = store.find((s) => s.email === this.email);
    if (existing) {
      Object.assign(existing, this);
      return existing;
    }
    store.push(this);
    return this;
  }
}

const Newsletter = {
  async findOne({ email }) {
    return store.find((s) => s.email === email) || null;
  },
  async create(data) {
    const doc = new NewsletterDoc(data);
    store.push(doc);
    return doc;
  },
  async deleteMany() {
    store.length = 0;
  },
};

export default Newsletter;