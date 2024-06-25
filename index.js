const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/TODO_DB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
});

// Schemas and Models
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});

const TodoSchema = new mongoose.Schema({
  todo: { type: String, required: true },
});

const User = mongoose.model('User', UserSchema);
const Todo = mongoose.model('Todo', TodoSchema);

// Signup route
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    name,
    email,
    password: hashedPassword,
  });

  newUser.save()
    .then(() => res.json({ message: 'User created successfully' }))
    .catch(err => res.status(400).json({ error: 'Email already exists' }));
});

// Login route
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) return res.status(400).json({ error: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

  const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
  res.json({ message: 'Login successful', token });
});

// Todo CRUD routes
app.post('/posting', async (req, res) => {
  try {
    const todo = new Todo(req.body);
    const result = await todo.save();
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).send('Something went wrong');
  }
});

app.get('/getting', async (req, res) => {
  try {
    const todos = await Todo.find({});
    res.json(todos);
  } catch (e) {
    console.error(e);
    res.status(500).send('Failed to retrieve todos');
  }
});

app.put('/updating/:id', async (req, res) => {
  const { id } = req.params;
  const { todo } = req.body;

  try {
    const updatedTodo = await Todo.findByIdAndUpdate(id, { todo }, { new: true });

    if (!updatedTodo) {
      return res.status(404).send('Todo not found');
    }

    res.json(updatedTodo);
  } catch (error) {
    console.error('Failed to update todo:', error);
    res.status(500).send('Failed to update todo');
  }
});

app.delete('/deleting/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const result = await Todo.findByIdAndDelete(id);

    if (!result) {
      return res.status(404).send('Todo not found');
    }

    res.send('Todo deleted successfully');
  } catch (e) {
    console.error(e);
    res.status(500).send('Failed to delete todo');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
