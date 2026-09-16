

const { DEFAULT_PAGE, DEFAULT_LIMIT, MAX_LIMIT } = require('../config/constants');



const getPagination = (query = {}) => {
  const page  = Math.max(1, parseInt(query.page,  10) || DEFAULT_PAGE);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(query.limit, 10) || DEFAULT_LIMIT));
  const skip  = (page - 1) * limit;
  return { page, limit, skip };
};


const buildMeta = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};



const pick = (obj, keys) =>
  keys.reduce((acc, key) => {
    if (obj[key] !== undefined) acc[key] = obj[key];
    return acc;
  }, {});

module.exports = { getPagination, buildMeta, pick };
