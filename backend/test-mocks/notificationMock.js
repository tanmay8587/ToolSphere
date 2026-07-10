// In-memory mock of the Notification model for testing the subscribe controller
// without a live MongoDB connection.

const store = [];

const Notification = {
  async create(data) {
    const doc = { ...data, _id: `notif_${store.length}` };
    store.push(doc);
    return doc;
  },
  async deleteMany() {
    store.length = 0;
  },
};

export default Notification;