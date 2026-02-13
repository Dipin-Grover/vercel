const len = 8;

function generate() {
  let ans = "";
  const subset =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz0123456789";

  for (let i = 0; i < len; ++i) {
    ans += subset[Math.floor(Math.random() * subset.length)];
  }
  return ans;
}

module.exports = generate;
