"use strict";

var TouchHistoryMath = {
  centroidDimension: function(touchHistory, touchesChangedAfter, isXAxis, ofCurrent) {
    var touchBank = touchHistory.touchBank;
    var total = 0;
    var count = 0;

    var oneTouchData = touchHistory.numberActiveTouches === 1 ?
      touchHistory.touchBank[touchHistory.indexOfSingleActiveTouch] : null;

    if (oneTouchData !== null) {
      if (oneTouchData.touchActive && oneTouchData.currentTimeStamp > touchesChangedAfter) {
        total += ofCurrent && isXAxis ? oneTouchData.currentPageX :
          ofCurrent && !isXAxis ? oneTouchData.currentPageY :
          !ofCurrent && isXAxis ? oneTouchData.previousPageX :
          oneTouchData.previousPageY;
        count = 1;
      }
    } else {
      for (var i = 0; i < touchBank.length; i++) {
        var touchTrack = touchBank[i];
        if (touchTrack !== null &&
            touchTrack !== undefined &&
            touchTrack.touchActive &&
            touchTrack.currentTimeStamp >= touchesChangedAfter) {
          var toAdd;  // Yuck, program temporarily in invalid state.
          if (ofCurrent && isXAxis) {
            toAdd = touchTrack.currentPageX;
          } else if (ofCurrent && !isXAxis) {
            toAdd = touchTrack.currentPageY;
          } else if (!ofCurrent && isXAxis) {
            toAdd = touchTrack.previousPageX;
          } else {
            toAdd = touchTrack.previousPageY;
          }
          total += toAdd;
          count++;
        }
      }
    }
    return count > 0 ? total / count : TouchHistoryMath.noCentroid;
  },

  currentCentroidXOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      true,  // isXAxis
      true   // ofCurrent
    );
  },

  currentCentroidYOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      false,  // isXAxis
      true    // ofCurrent
    );
  },

  previousCentroidXOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      true,  // isXAxis
      false  // ofCurrent
    );
  },

  previousCentroidYOfTouchesChangedAfter: function(touchHistory, touchesChangedAfter) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      touchesChangedAfter,
      false,  // isXAxis
      false   // ofCurrent
    );
  },

  currentCentroidX: function(touchHistory) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      0,     // touchesChangedAfter
      true,  // isXAxis
      true   // ofCurrent
    );
  },

  currentCentroidY: function(touchHistory) {
    return TouchHistoryMath.centroidDimension(
      touchHistory,
      0,     // touchesChangedAfter
      false,  // isXAxis
      true    // ofCurrent
    );
  },
  noCentroid: -1,

  distance: function(touchA, touchB, ofCurrent) {
    if(touchA && touchB) {
      var xa, ya, xb, yb;
      if(ofCurrent) {
        xa = touchA.currentPageX;
        ya = touchA.currentPageY;
        xb = touchB.currentPageX;
        yb = touchB.currentPageY;
      } else {
        xa = touchA.previousPageX;
        ya = touchA.previousPageY;
        xb = touchB.previousPageX;
        yb = touchB.previousPageY;
      }
      return Math.sqrt(Math.pow(xa - xb, 2) + Math.pow(ya - yb, 2));
    }
  },
  maxDistance: function(touches, ofCurrent) {
    if(touches && touches.length > 1) {
      var maxDistance = 0;
      for(var i = 0; i < touches.length - 1; i++) {
        for(var j = i+1; j < touches.length; j++) {
          var distance = this.distance(touches[i], touches[j], ofCurrent);
          if(distance > maxDistance) {
            maxDistance = distance;
          }
        }
      }
      return maxDistance;
    }
  },
  pinchDistance: function(touchHistory, touchesChangedAfter, ofCurrent) {
    var touchBank = touchHistory.touchBank;
    if(touchHistory.numberActiveTouches > 1) {
      var filteredTouchBank = touchBank.filter((touchTrack) => {
        return touchTrack && touchTrack.currentTimeStamp >= touchesChangedAfter;
      });
      return this.maxDistance(filteredTouchBank, ofCurrent);
    }
  },
};

module.exports = TouchHistoryMath;
