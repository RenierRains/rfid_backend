const db = require('../models');
const { Op } = require('sequelize');
const jwt = require('jsonwebtoken');

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.JWT_SECRET || 'SuperSecretKey', (err, decoded) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = decoded;
    next();
  });
};

exports.getAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date } = req.query;
    let whereClause = { user_id: userId };
    if (date) {
      //date is in YYYY-MM-DD
      const start = new Date(date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(date);
      end.setHours(23, 59, 59, 999);
      whereClause.timestamp = { [db.Sequelize.Op.between]: [start, end] };
    }
    const logs = await db.Entry_Exit_Log.findAll({ where: whereClause, order: [['timestamp', 'ASC']] });
    res.json({ attendance: logs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve attendance records' });
  }
};

exports.getSchedule = async (req, res) => {
  try {
    const userId = req.user.userId;
    let date = req.query.date ? new Date(req.query.date) : new Date();
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayAbbrev = days[date.getDay()];
    
    const enrollments = await db.Class_Enrollment.findAll({
      where: { student_id: userId },
      include: [{
        model: db.Class,
        as: 'classData',
        where: {
          schedule: { [Op.like]: `%${dayAbbrev}%` }
        }
      }]
    });
    
    const classes = enrollments.map(enrollment => enrollment.classData);
    
    res.json({
      date: date.toISOString().slice(0,10),
      schedule: classes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get student schedule' });
  }
};