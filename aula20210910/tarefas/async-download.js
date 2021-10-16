
export default (path, filename, res) => {
  return new Promise((resolve, reject) => {
    res.download(path, filename, err => {
      if (err) reject(err);
      else resolve();
    });
  });
}
