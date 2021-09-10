
export default function (asyncFn) {
  return function (req, res, next) {
    asyncFn(req, res, next).catch(next);
  };
}
