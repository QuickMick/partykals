import * as THREE from "three";
const VEC_A = new THREE.Vector3();
const VEC_B = new THREE.Vector3();

function swapVectorArray(array, leftIndex, rightIndex) {
  const vecIndexLeft = leftIndex * 3;
  const vecIndexRight = rightIndex * 3;

  const tmp1 = array[vecIndexLeft];
  const tmp2 = array[vecIndexLeft + 1];
  const tmp3 = array[vecIndexLeft + 2];

  array[vecIndexLeft] = array[vecIndexRight];
  array[vecIndexLeft + 1] = array[vecIndexRight + 1];
  array[vecIndexLeft + 2] = array[vecIndexRight + 2];

  array[vecIndexRight] = tmp1;
  array[vecIndexRight + 2] = tmp2;
  array[vecIndexRight + 3] = tmp3;
}

function swapArray(array, leftIndex, rightIndex) {
  const tmp = array[leftIndex];
  array[leftIndex] = array[rightIndex];
  array[rightIndex] = tmp;
}

function swap(leftIndex, rightIndex) {
  // https://www.guru99.com/quicksort-in-javascript.html
  swapVectorArray(this.particlesGeometry.attributes.color.array, leftIndex, rightIndex);
  swapVectorArray(this.particlesGeometry.attributes.position.array, leftIndex, rightIndex);
  swapArray(this.particlesGeometry.attributes.alpha.array, leftIndex, rightIndex);
  swapArray(this.particlesGeometry.attributes.rotation.array, leftIndex, rightIndex);
  swapArray(this.particlesGeometry.attributes.size.array, leftIndex, rightIndex);
}

var items = [5, 3, 7, 6, 2, 9];
// function swap(items, leftIndex, rightIndex) {
//   var temp = items[leftIndex];
//   items[leftIndex] = items[rightIndex];
//   items[rightIndex] = temp;
// }
function partition(items, left, right) {
  var pivot = items[Math.floor((right + left) / 2)], //middle element
    i = left, //left pointer
    j = right; //right pointer
  while (i <= j) {
    while (items[i] < pivot) {
      i++;
    }
    while (items[j] > pivot) {
      j--;
    }
    if (i <= j) {
      swap(items, i, j); //sawpping two elements
      i++;
      j--;
    }
  }
  return i;
}

function quickSort(items, left, right) {
  var index;
  if (items.length <= 1) return items;
  index = partition(items, left, right); //index returned from partition
  if (left < index - 1) {
    //more elements on the left side of the pivot
    quickSort(items, left, index - 1);
  }
  if (index < right) {
    //more elements on the right side of the pivot
    quickSort(items, index, right);
  }
  return items;
}

function getDist(index) {
  const vertices = this.particlesGeometry.attributes.position.array;
  VEC_A.set(vertices[index], vertices[index + 1], vertices[index + 2]);
  const distA = this.camera.position.distanceToSquared(VEC_A);
  return distA;
}

function compare(leftIndex, rightIndex) {
  const distA = getDist(leftIndex);
  const distB = getDist(rightIndex);

  return distA > distB;
}

function compareWithNumber(index, number) {
  const distA = getDist(index);
  return distA > number;
}

// first call to quick sort
var sortedArray = quickSort(items, 0, items.length - 1);
console.log(sortedArray); //prints [2,3,5,6,7,9]
