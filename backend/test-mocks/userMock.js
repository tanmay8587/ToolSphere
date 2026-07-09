// In-memory mock of the User model for testing the subscribe controller
// without a live MongoDB connection.

const users = [];
let counter = 0;

const User = {
  async findById(id) {
    return users.find((u) => String(u._id) === String(id)) || null;
  },
  async create(data) {
    const u = { _id: `mockuser_${counter++}`, ...data };
    users.push(u);
    return u;
  },
  async deleteMany() {
    users.length = 0;
  },
};

export default User;