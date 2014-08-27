
/**
Expose getValue
*/
module.exports.getValue = getObjectValue;


/**
Read the value from the given object at the specified path. If the
path does not exist, defValue is returned
*/
function getObjectValue(obj, path, defValue) {
  var i;
  var iLen;
  var value;

  path = path.split('.');

  for (i = 0, iLen = path.length; i < iLen; ++i) {
    if (obj === null || typeof obj !== 'object' || !(path[i] in obj)) {
      obj = defValue;
      i = iLen;
    } else {
      obj = obj[path[i]];
    }
  }

  return obj;
}