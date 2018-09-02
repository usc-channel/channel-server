const { Course, Lecturer, Review, User } = require('../models');
const { Op } = require('sequelize');

async function list(req, res) {
  const lecturerId = req.query.lecturerId || '';

  try {
    const reviews = await Review.findAll({
      where: {
        [Op.or]: [
          {
            lecturerId: {
              [Op.like]: `%${lecturerId}%`,
            },
          },
        ],
      },
      include: [
        {
          model: User,
          attributes: ['name', 'avatar'],
        },
        {
          model: Course,
          attributes: ['code', 'name'],
        },
        {
          model: Lecturer,
          attributes: ['name'],
        },
      ],
      attributes: ['id', 'semester', 'year', 'comment', 'rating'],
    });

    return res.send(reviews);
  } catch (error) {
    return res.boom.serverUnavailable();
  }
}

async function create(req, res) {
  try {
    const reviews = await Review.findAll({
      where: {
        userId: req.body.user_id,
        lecturerId: req.body.lecturer_id,
        courseId: req.body.course_id,
      },
    });

    if (reviews.length > 0) {
      return res.boom.conflict(
        `You've already made a review for this course and lecturer.`
      );
    }

    const review = await Review.create({
      userId: req.body.user_id,
      lecturerId: req.body.lecturer_id,
      courseId: req.body.course_id,
      semester: req.body.semester,
      year: req.body.year,
      rating: req.body.rating,
      comment: req.body.comment,
    });

    return res.send(review);
  } catch (error) {
    switch (error.name) {
      case 'SequelizeForeignKeyConstraintError':
        return res.boom.conflict('', {
          errors: error.fields.map(a => `Constraint failed for ${a}`),
        });
      case 'SequelizeValidationError':
        return res.boom.badData('', {
          errors: error.errors.map(a => a.message),
        });
      default:
        res.boom.serverUnavailable();
    }
  }
}

module.exports = {
  list,
  create,
};
