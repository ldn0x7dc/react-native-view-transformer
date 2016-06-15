"use strict";

var TouchHistoryMath = require('./TouchHistoryMath');

var currentCentroidXOfTouchesChangedAfter =
  TouchHistoryMath.currentCentroidXOfTouchesChangedAfter;
var currentCentroidYOfTouchesChangedAfter =
  TouchHistoryMath.currentCentroidYOfTouchesChangedAfter;
var previousCentroidXOfTouchesChangedAfter =
  TouchHistoryMath.previousCentroidXOfTouchesChangedAfter;
var previousCentroidYOfTouchesChangedAfter =
  TouchHistoryMath.previousCentroidYOfTouchesChangedAfter;
var currentCentroidX = TouchHistoryMath.currentCentroidX;
var currentCentroidY = TouchHistoryMath.currentCentroidY;

const MIN_MOVE_DISTANCE = 10;

var PanAndPinchResponder = {

  _initializeGestureState: function (gestureState) {
    gestureState.moveX = 0;
    gestureState.moveY = 0;
    gestureState.x0 = 0;
    gestureState.y0 = 0;
    gestureState.dx = 0;
    gestureState.dy = 0;
    gestureState.dxSinceLast = 0;
    gestureState.dySinceLast = 0;
    gestureState.vx = 0;
    gestureState.vy = 0;
    gestureState.numberActiveTouches = 0;
    // All `gestureState` accounts for timeStamps up until:
    gestureState._accountsForMovesUpTo = 0;


    gestureState.currentPinchDistance = undefined;
    gestureState.previousPinchDistance = undefined;
    gestureState.centroidX = 0;
    gestureState.centroidY = 0;

    gestureState.singleTabUpFailed = false;
    gestureState.flingFailed = false;
    gestureState.releaseWithFling = false;
    gestureState.releaseWithDoubleTab = false;
    gestureState.minMoveDistanceAchieved = false;

  },

  _updateGestureStateOnMove: function (gestureState, touchHistory) {
    gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
    gestureState.moveX = currentCentroidXOfTouchesChangedAfter(
      touchHistory,
      gestureState._accountsForMovesUpTo
    );
    gestureState.moveY = currentCentroidYOfTouchesChangedAfter(
      touchHistory,
      gestureState._accountsForMovesUpTo
    );
    var movedAfter = gestureState._accountsForMovesUpTo;
    var prevX = previousCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
    var x = currentCentroidXOfTouchesChangedAfter(touchHistory, movedAfter);
    var prevY = previousCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
    var y = currentCentroidYOfTouchesChangedAfter(touchHistory, movedAfter);
    var nextDX = gestureState.dx + (x - prevX);
    var nextDY = gestureState.dy + (y - prevY);

    // TODO: This must be filtered intelligently.
    var dt =
      (touchHistory.mostRecentTimeStamp - gestureState._accountsForMovesUpTo);
    gestureState.vx = (nextDX - gestureState.dx) / dt;
    gestureState.vy = (nextDY - gestureState.dy) / dt;

    gestureState.dx = nextDX;
    gestureState.dy = nextDY;
    gestureState._accountsForMovesUpTo = touchHistory.mostRecentTimeStamp;


    gestureState.dxSinceLast = x - prevX;
    gestureState.dySinceLast = y - prevY;
    gestureState.previousPinchDistance = TouchHistoryMath.pinchDistance(touchHistory, movedAfter, false);
    gestureState.currentPinchDistance = TouchHistoryMath.pinchDistance(touchHistory, movedAfter, true);
    gestureState.centroidX = currentCentroidX(touchHistory);
    gestureState.centroidY = currentCentroidY(touchHistory);

    if (!gestureState.minMoveDistanceAchieved && (Math.abs(gestureState.dx) >= MIN_MOVE_DISTANCE || Math.abs(gestureState.dy) >= MIN_MOVE_DISTANCE)) {
      gestureState.minMoveDistanceAchieved = true;
    }
  },

  create: function (config) {
    var gestureState = {
      // Useful for debugging
      stateID: Math.random(),
    };
    PanAndPinchResponder._initializeGestureState(gestureState);
    var handlers = {
      onStartShouldSetResponder: function (e) {
        return config.onStartShouldSetPanAndPinchResponder ?
          config.onStartShouldSetPanAndPinchResponder(e, gestureState) : false;
      },
      onMoveShouldSetResponder: function (e) {
        return config.onMoveShouldSetPanAndPinchResponder ?
          config.onMoveShouldSetPanAndPinchResponder(e, gestureState) : false;
      },
      onStartShouldSetResponderCapture: function (e) {
        // TODO: Actually, we should reinitialize the state any time
        // touches.length increases from 0 active to > 0 active.
        if (e.nativeEvent.touches.length === 1) {
          PanAndPinchResponder._initializeGestureState(gestureState);
        }
        gestureState.numberActiveTouches = e.touchHistory.numberActiveTouches;
        return config.onStartShouldSetPanAndPinchResponderCapture ?
          config.onStartShouldSetPanAndPinchResponderCapture(e, gestureState) : false;
      },

      onMoveShouldSetResponderCapture: function (e) {
        var touchHistory = e.touchHistory;
        // Responder system incorrectly dispatches should* to current responder
        // Filter out any touch moves past the first one - we would have
        // already processed multi-touch geometry during the first event.
        if (gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp) {
          return false;
        }
        PanAndPinchResponder._updateGestureStateOnMove(gestureState, touchHistory);
        return config.onMoveShouldSetPanAndPinchResponderCapture ?
          config.onMoveShouldSetPanAndPinchResponderCapture(e, gestureState) : false;
      },

      onResponderGrant: function (e) {
        console.log('onResponderGrant...');
        gestureState.lastGrantTime = e.touchHistory.mostRecentTimeStamp;

        gestureState.x0 = currentCentroidX(e.touchHistory);
        gestureState.y0 = currentCentroidY(e.touchHistory);
        gestureState.dx = 0;
        gestureState.dy = 0;
        gestureState.dxSinceLast = 0;
        gestureState.dySinceLast = 0;
        gestureState.centroidX = currentCentroidX(e.touchHistory);
        gestureState.centroidY = currentCentroidY(e.touchHistory);

        config.onPanAndPinchResponderGrant && config.onPanAndPinchResponderGrant(e, gestureState);
        // TODO: t7467124 investigate if this can be removed
        return config.onShouldBlockNativeResponder === undefined ? true :
          config.onShouldBlockNativeResponder();
      },

      onResponderReject: function (e) {
        config.onPanAndPinchResponderReject && config.onPanAndPinchResponderReject(e, gestureState);
      },

      onResponderRelease: function (e) {
        console.log('onResponderRelease...');

        if (!gestureState.singleTabUpFailed) {
          config.onPanAndPinchResponderSingleTabUp &&
          config.onPanAndPinchResponderSingleTabUp(e, gestureState);
          if (gestureState.lastSingleTabUp && e.touchHistory.mostRecentTimeStamp - gestureState.lastReleaseTime < 300) {
            gestureState.releaseWithDoubleTab = true;
            config.onPanAndPinchResponderDoubleTabUp &&
            config.onPanAndPinchResponderDoubleTabUp(e, gestureState);
          }
          gestureState.lastSingleTabUp = true;
        } else {
          gestureState.lastSingleTabUp = false;
        }

        if (!gestureState.flingFailed) {
          gestureState.releaseWithFling = true;
          config.onPanAndPinchResponderFling && config.onPanAndPinchResponderFling(e, gestureState);
        } else {
          gestureState.releaseWithFling = false;
        }


        gestureState.lastReleaseTime = e.touchHistory.mostRecentTimeStamp;
        console.log('onResponderRelease...velocity ' + gestureState.vx + ' ' + gestureState.vy);
        config.onPanAndPinchResponderRelease && config.onPanAndPinchResponderRelease(e, gestureState);
        PanAndPinchResponder._initializeGestureState(gestureState);
      },

      onResponderStart: function (e) {
        var touchHistory = e.touchHistory;
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        config.onPanAndPinchResponderStart && config.onPanAndPinchResponderStart(e, gestureState);
      },

      onResponderMove: function (e) {
        var touchHistory = e.touchHistory;
        // Guard against the dispatch of two touch moves when there are two
        // simultaneously changed touches.
        if (gestureState._accountsForMovesUpTo === touchHistory.mostRecentTimeStamp) {
          return;
        }
        // Filter out any touch moves past the first one - we would have
        // already processed multi-touch geometry during the first event.
        PanAndPinchResponder._updateGestureStateOnMove(gestureState, touchHistory);

        if (gestureState.minMoveDistanceAchieved || e.touchHistory.numberActiveTouches > 1) {
          config.onPanAndPinchResponderMove && config.onPanAndPinchResponderMove(e, gestureState);
        }
      },

      onResponderEnd: function (e) {
        var touchHistory = e.touchHistory;
        gestureState.numberActiveTouches = touchHistory.numberActiveTouches;
        config.onPanAndPinchResponderEnd && config.onPanAndPinchResponderEnd(e, gestureState);

        if (touchHistory.mostRecentTimeStamp - gestureState.lastGrantTime > 300 || touchHistory.numberActiveTouches > 0) {
          gestureState.singleTabUpFailed = true;
        }
        if (touchHistory.numberActiveTouches > 0 || Math.hypot(gestureState.vx, gestureState.vy) < 1 ) {
          gestureState.flingFailed = true;
        }

        console.log('onResponderEnd...numberActiveTouches=' + touchHistory.numberActiveTouches + ', singleTabUpFailed=' + gestureState.singleTabUpFailed);
      },

      onResponderTerminate: function (e) {
        config.onPanAndPinchResponderTerminate &&
        config.onPanAndPinchResponderTerminate(e, gestureState);
        PanAndPinchResponder._initializeGestureState(gestureState);
      },

      onResponderTerminationRequest: function (e) {
        return config.onPanAndPinchResponderTerminationRequest === undefined ? true :
          config.onPanAndPinchResponderTerminationRequest(e, gestureState);
      },
    };
    return handlers;
  },
};

module.exports = PanAndPinchResponder;
