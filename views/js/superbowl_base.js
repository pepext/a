/*
 * -------------- GENERAL --------------
 */
var superbowl = {

    _array: [0,1,2,3,4,5,6,7,8,9],
    _isDev: false,
    _loggedInUser: null,
    // Rows
    _team1Index: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    // Columns
    _team2Index: ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
    _userSelectedBoxes: {},
    users: {},
    pricePerBox: 10,
    isSetup: false,

    isClosed: function() {
        var superBowlDate = new Date("Sun Feb 5 2017 15:30:00 GMT-0800 (PST)");
        var currentDate = new Date();
        return currentDate > superBowlDate;
    },

    createGrid: function() {
        superbowl._loggedInUser.boxCount = 0;

        var squareContainer = $('.square');
        var boxSize = squareContainer.width()/11;
        var ratioW = 11,
            ratioH = 11;

        squareContainer.css('height', squareContainer.width());
        squareContainer[0].innerHTML = '';

        var parent = $('<div />', {
            class: 'grid',
            width: ratioW  * boxSize,
            height: ratioH  * boxSize
        }).addClass('grid').appendTo(squareContainer);

        var index = 1;

        for (var ii = 1; ii < ratioH + 1; ii++) {
            for(var jj = 1; jj < ratioW + 1; jj++){

                var aBox = $('<div />', {
                    width: boxSize - 1,
                    height: boxSize - 1
                });
                var aBoxElement = aBox[0];

                if (ii != 1 && jj != 1) {
                    aBox.attr('index', index);
                    aBox.attr('col', jj-1);
                    aBox.attr('row', ii-1);
                    aBoxElement.addEventListener('mouseover', this.ui.onBoxHover.bind(superbowl));
                    aBoxElement.addEventListener('mouseout', this.ui.onBoxHover.bind(superbowl));
                    if (!this.isClosed()) {
                        aBoxElement.addEventListener('click', this.ui.handleBoxClicked.bind(superbowl));
                    }
                    var userIdForBox = this._userSelectedBoxes[index];
                    if (userIdForBox) {
                        aBoxElement.classList.add('selected');
                        this.ui.addUserImageToBox(userIdForBox, aBoxElement);
                        if (userIdForBox == superbowl._loggedInUser.id) {
                            superbowl._loggedInUser.boxCount++;

                        }
                    }
                    index++;
                } else if (ii != 1 || jj != 1) {
                    aBoxElement.classList.add('header');
                }
                aBox.appendTo(parent);
            }
        }

        // Add box numbers
        var headerBoxes = document.querySelectorAll('.header');
        for (var ii = 0; ii < headerBoxes.length; ii++) {
            var aHeader;
            if (ii < 10) {
                aHeader = $('<p>' + this._team1Index[ii] + '</p>');
                headerBoxes[ii].setAttribute('col', ii+1);
            } else {
                aHeader = $('<p>' + this._team2Index[ii-10] + '</p>');
                headerBoxes[ii].setAttribute('row', ii-9);
            }
            aHeader.css('line-height', (boxSize - 1) + 'px');
            aHeader.appendTo(headerBoxes[ii]);
        }
    },

    setupUserPicks: function() {
        var userPicksContainer = $('.user-picks-container');
        userPicksContainer[0].innerHTML = '';
        var loggedInUser = superbowl._loggedInUser;

        userPicksContainer.append(superbowl.ui.createPicksLockupsForUser(this.users[loggedInUser.id]));

        for (var userId in this.users) {
            if (userId != loggedInUser.id && this.users[userId].scores.length > 0) {
                userPicksContainer.append(superbowl.ui.createPicksLockupsForUser(this.users[userId]));
            }
        }
    },

    userIdForIndex: function(index) {
        return this._userSelectedBoxes[index];
    },

    userInfoForId: function(id) {
        return this.users[id];
    },

    scoresForBoxNumber: function(index) {
        var box = document.querySelector('[index="' + index + '"]');

        return {
            team1: this._team1Index[box.getAttribute('col')-1],
            team2: this._team2Index[box.getAttribute('row')-1]
        };
    },

    init: function() {
        var logoutButton = document.querySelector('.logout-button');
        logoutButton.addEventListener('click', this.auth.logout);
        var rulesButton = document.querySelector('.rules-button');
        rulesButton.addEventListener('click', this.ui.showRulesAndPayoutsWindow);
        var rulesCloseButton = document.querySelector('.rules-and-payout .close');
        rulesCloseButton.addEventListener('click', this.ui.hideRulesAndPayoutsWindow);
        var boxViewButton = document.querySelector('.box-view');
        boxViewButton.addEventListener('click', this.ui.showBoxView);
        var listViewButton = document.querySelector('.list-view');
        listViewButton.addEventListener('click', this.ui.showListView);
    }
};

/*
 * -------------- AUTH --------------
 */
superbowl.auth = {

    loggedIn: function() {
        return superbowl._loggedInUser != null
    },

    init: function() {
        var currentProductDataElement = $('#user-data');
        if (currentProductDataElement) {
            var userData = JSON.parse(currentProductDataElement.html().trim());
            if (userData && userData.id) {
                superbowl._loggedInUser = userData;
            }
        }

        if (!this.loggedIn()) {
            superbowl.ui.showSignInWindow();
        } else {
            superbowl.ui.hideSignInWindow();
            superbowl.init();
            superbowl.data.fetchAllUsers();
        }
    },

    login: function() {
        window.location.href = "login/twitter";
    },

    logout: function() {
        var logoutUrl = "auth/logout";
        var logoutCallback = function() {
            superbowl._loggedInUser = null;
            superbowl.ui.showSignInWindow();
        };
        superbowl.data.fetchServerData(logoutUrl, {}, logoutCallback.bind(this));

    }
};

/*
 * -------------- UI --------------
 */
superbowl.ui = {
    scrollToTop: function() {
        $("html, body").animate({ scrollTop: 0 }, "slow");
    },

    showSignInWindow: function() {
        window.location = "login";
    },

    hideSignInWindow: function() {
        var body = document.querySelector('body');
        body.classList.remove('login');
        body.classList.add('ready');
    },

    showRulesAndPayoutsWindow: function() {
        var body = document.querySelector('body');
        body.classList.add('rules');
        superbowl.ui.scrollToTop();
    },

    hideRulesAndPayoutsWindow: function() {
        var body = document.querySelector('body');
        body.classList.remove('rules');
    },

    handleBoxClicked: function(event) {
        var aBox = event.target;
        var index = aBox.getAttribute('index');
        if (aBox.classList.contains('selected')) {
            superbowl.data.removeBox(index, superbowl._loggedInUser.id, function(){
                aBox.innerHTML = '';
                superbowl.data.fetchSquareData();
                aBox.classList.remove('selected');
            });
        } else {
            superbowl.data.addBox(index, superbowl._loggedInUser.id, function() {
                aBox.classList.add('selected');
                superbowl.data.fetchSquareData();
                superbowl.ui.addUserImageToBox(superbowl._loggedInUser.id, aBox);
            });
        }
    },

    addUserImageToBox: function(userId, aBox) {
        var userInfo = superbowl.userInfoForId(userId);
        if (userInfo && userInfo.userPhoto) {
            var fbImage = document.createElement('img');
            fbImage.setAttribute('src', userInfo.userPhoto.url);
            fbImage.classList.add('user-photo');
            aBox.appendChild(fbImage);
        }
    },

    onBoxHover: function(event) {
        var aBox = event.target;
        var index = aBox.getAttribute('index');
        var row = aBox.getAttribute('row');
        var col = aBox.getAttribute('col');
        var rowHeaderSelector = 'p.header[row=' + row +  ']';
        var colHeaderSelector = 'p.header[col=' + col +  ']';
        var rowHeaderElement = $(rowHeaderSelector);
        var colHeaderElement = $(colHeaderSelector);
        if (event.type == 'mouseover') {
            superbowl.ui.setBoxInfo(index, row, col);
            rowHeaderElement.addClass('selected');
            colHeaderElement.addClass('selected');
        } else {
            rowHeaderElement.removeClass('selected');
            colHeaderElement.removeClass('selected');
            superbowl.ui.setBoxInfo(index);
        }
    },

    setBoxInfo: function(index, row, col) {
        var boxInfo = document.querySelector('.box-info');
        var infoListElement = boxInfo.querySelector('.info');
        var usernameContainerElement = infoListElement.querySelector('.user-name');
        var usernameElement = usernameContainerElement.querySelector('p');
        var team1ScoreElement = document.querySelector('.team1 .score');
        var team2ScoreElement = document.querySelector('.team2 .score');
        var imgContainerElement = infoListElement.querySelector('.user-photo');
        var imgElement = imgContainerElement.querySelector('img');
        var idForIndex = superbowl.userIdForIndex(index);
        if (idForIndex && superbowl.userInfoForId(idForIndex)) {
            var userInfoForId = superbowl.userInfoForId(idForIndex);
            superbowl.ui.setInnerText(usernameElement, userInfoForId.first_name);
            usernameContainerElement.classList.remove('removed');
            imgContainerElement.classList.remove('removed');
            imgElement.setAttribute('src', userInfoForId.userPhoto.url);
        } else {
            superbowl.ui.setInnerText(usernameElement, '');
            usernameContainerElement.classList.add('removed');
            imgContainerElement.classList.add('removed');
        }
        if (row && col) {
            superbowl.ui.setInnerText(team1ScoreElement, superbowl._team1Index[col-1]);
            superbowl.ui.setInnerText(team2ScoreElement, superbowl._team2Index[row-1]);
        } else {
            superbowl.ui.setInnerText(team1ScoreElement, '');
            superbowl.ui.setInnerText(team2ScoreElement, '');
        }
    },

    createPicksLockupsForUser: function(user) {
        var userPicksLockup = $('<div class="user-picks"></div>');
        var userInfoTop = $('<div class="user-info-top"></div>');
        var userPhoto = $('<div class="user-photo"><img class="user-photo" src="' + user.userPhoto.url + '"></div>');
        var nameForUser = user.id == superbowl._loggedInUser.id ? "Me" : user.first_name;
        var userName = $('<div class="user-name"><p class="name">' + nameForUser + '</p></div>');
        var teamLogos = $('<ul class="picks"><li class="left"><img class="team-logo" src="https://cdn.gomix.com/55dbb2a4-94d9-434f-9dcc-1432c975de1c%2Flogo_team1.png"/></li><li  class="right"><img class="team-logo" src="https://cdn.gomix.com/55dbb2a4-94d9-434f-9dcc-1432c975de1c%2Flogo_team2.png"/></li></ul>');
        var userPicks = $('<ul class="picks"></ul>');
        for (var ii = 0; ii < user.scores.length; ii++) {
            var aScore = user.scores[ii];
            userPicks.append($('<li class="left"><h4 class="value">' + aScore.team1 + '</h4></li>'));
            userPicks.append($('<li class="right"><h4 class="value">' + aScore.team2 + '</h4></li>'));
        }

        userInfoTop.append(userPhoto);
        userInfoTop.append(userName);
        userPicksLockup.append(userInfoTop);
        userPicksLockup.append(teamLogos);
        userPicksLockup.append(userPicks);

        return userPicksLockup;
    },

    setInnerText: function(element, text) {
        element.innerHTML = '';
        element.appendChild(document.createTextNode(text));
    },

    showListView: function(event) {
        if (!event.target.classList.contains('selected') && superbowl.isSetup) {
            event.target.classList.add('selected');
            document.querySelector('.box-view').classList.remove('selected');
            document.querySelector('.square-container').classList.add('hidden');
            document.querySelector('.square').classList.add('hidden');
            document.querySelector('.team-info').classList.add('hidden');
            document.querySelector('.user-picks-container').classList.remove('hidden');
            superbowl.ui.scrollToTop();
        }
    },

    showBoxView: function(event) {
        if (!event.target.classList.contains('selected') && superbowl.isSetup) {
            event.target.classList.add('selected');
            document.querySelector('.list-view').classList.remove('selected');
            document.querySelector('.user-picks-container').classList.add('hidden');
            document.querySelector('.square-container').classList.remove('hidden');
            document.querySelector('.team-info').classList.remove('hidden');
            document.querySelector('.square').classList.remove('hidden');
            superbowl.ui.scrollToTop();
        }
    }

};

superbowl.data = {
    _addUserSelectedBoxesUrl: function() {
        return 'addBox';
    },
    _getAllBoxesUrl: function() {
        return 'boxes';
    },
    _removeAllBoxesUrl: function() {
        return 'removeAllBoxes';
    },
    _removeBoxUrl: function() {
        return 'removeBox';
    },
    _addUserUrl: function() {
        return 'addUser';
    },
    _getAllUsersUrl: function() {
        return 'users';
    },
    _getSquareData: function() {
        return 'squareData';
    },

    /**
    
     * @param url - SuperBowl url to fetch data from
     * @param queryDict
     * @param callback
     */
    fetchServerData: function(url, queryDict, callback) {
        $.ajax({
            url: url,
            dataType: 'json',
            data: queryDict,
            success: callback
        });
    },

    fetchSquareData: function() {
        var boxesFetchedCallback = function(data) {
            superbowl._userSelectedBoxes = data.selectedBoxes;
            superbowl._loggedInUser = data.userData;
            this.clearUserScores();
            superbowl.createGrid();
            for (var boxNumber in superbowl._userSelectedBoxes) {
                var userId = superbowl._userSelectedBoxes[boxNumber];
                var aUser = superbowl.users[userId];
                if (!aUser.scores) {
                    aUser.scores = [];
                }
                aUser.scores.push(superbowl.scoresForBoxNumber(boxNumber));
            }
            superbowl.setupUserPicks(data);
            superbowl.isSetup = true;
            $(window).resize(superbowl.createGrid.bind(superbowl));
        };
        this.fetchServerData(superbowl.data._getSquareData(), {}, boxesFetchedCallback.bind(this));
    },

    clearUserScores: function() {
        for (var userId in superbowl.users) {
            superbowl.users[userId].scores = [];
        }
    },

    addBox: function(index, userId, callBack) {
        if (index && userId) {
            var boxInfo = {index: index, userId: userId};
            this.fetchServerData(superbowl.data._addUserSelectedBoxesUrl(), boxInfo, callBack.bind(superbowl));
        }
        console.log(this);
    },

    removeBox: function(index, userId, callBack) {
        var canRemoveThisBox = superbowl.userIdForIndex(index) == superbowl._loggedInUser.id;
        if (index && canRemoveThisBox) {
            var boxInfo = {index: index, userId: userId};
            this.fetchServerData(superbowl.data._removeBoxUrl(), boxInfo, callBack.bind(superbowl));
        }
    },

    fetchAllUsers: function() {
        var usersFetchedCallback = function(data) {
            superbowl.users = data;
            superbowl.data.fetchSquareData();
        };
        this.fetchServerData(superbowl.data._getAllUsersUrl(), {}, usersFetchedCallback.bind(this));
    }
};