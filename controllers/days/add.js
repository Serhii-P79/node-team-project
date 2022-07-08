const { Day, Product } = require('../../models');

const { BadRequest } = require('http-errors');

const addDay = async (req, res, next) => {
  const { productId: productIdSearch, weight, date: dateString } = req.body;
  const { _id: userId } = req.user;
  let date;

  //   console.log(dateString);
  //   console.log(productIdSearch);
  //   console.log(weight);
  //   console.log(userId);

  const produtc = await Product.findById(productIdSearch);

  if (!produtc) {
    throw BadRequest();
  }

  const { _id: productId } = produtc;

  //   console.log(productId);

  try {
    date = new Date(dateString);
  } catch (error) {
    error.status = 400;
    error.message = 'bad request';
    next(error);
  }
  //   console.log(date.toDateString());

  const result = await Day.create({
    product_id: productId,
    user_id: userId,
    date,
    weight,
  });

  result._doc.calories = Math.round(
    (weight * produtc._doc.calories) / produtc._doc.weight,
  );

  // console.log(result);

  res.status(201).json({
    status: 'success',
    code: 201,
    data: result,
  });
};

module.exports = addDay;
