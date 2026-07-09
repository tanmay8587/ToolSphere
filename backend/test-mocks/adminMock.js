// In-memory mock of the Admin model for testing the verifyAdmin middleware
// without a live MongoDB connection.

const admins = [];
let counter = 0;

const Admin = {
  async findById(id) {
    return admins.find((a) => String(a._id) === String(id)) || null;
  },
  async create(data) {
    const a = { _id: `mockadmin_${counter++}`, active: true, ...data };
    admins.push(a);
    return a;
  },
  async deleteMany() {
    admins.length = 0;
  },
};

export default Admin;