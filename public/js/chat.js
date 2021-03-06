var socket = io();

var scrollToBottom = function() {
    //selectors
    var messages = $('#messages');
    var newMessage = messages.children('li:last-child');
    //Heights
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight();

    if(clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight) {
        messages.animate({scrollTop:scrollHeight});
    }
};

socket.on('connect', function(){
    var params = $.deparam(window.location.search);
    socket.emit('join', params, (error) => {
        if(error) {
            alert(error);
            window.location.href = '/';
        }
    });
});

socket.on('disconnect', function(){
    console.log('disconnected from server');
});

socket.on('updateUserList', function(users) {
    var ol = $('<ol></ol>');
    users.forEach(function(name) {
        ol.append($('<li></li>').text(name));
    });
    $('#users').html(ol);
});

socket.on('newMessage', function(message){
    var template = $('#message-template').html();
    var formattedTime = moment(message.createdAt).format('LT');
    var html = Mustache.render(template, {
        text: message.text,
        from: message.from,
        createdAt: formattedTime
    });

    $('#messages').append(html);

    scrollToBottom();

    createNotification(message);
});

socket.on('newLocationMessage', function(message) {
    var template = $('#location-message-template').html();
    var formattedTime = moment(message.createdAt).format('LT');
    var html = Mustache.render(template, {
        url: message.url,
        from: message.from,
        createdAt: formattedTime
    });
    
    $('#messages').append(html);

    scrollToBottom();
    
    createNotification({
        from: message.from,
        text: `${message.from} shared their location`
    });
})

$('#message-form').on('submit', function(event) {
    event.preventDefault();
    var messageBox = $('[name=message]');
    socket.emit(
        'createMessage',
        {
            text: messageBox.val()
        },
        function(data) {
            messageBox.val('');
        }
    );
});

var locationButton = $('#send-location');
locationButton.click(function(event) {
    if(!('geolocation' in navigator)) {
        alert('Geolocation not supported by your browser');
    } else {
        locationButton.attr('disabled', 'disabled');
        locationButton.text('Sending Location...');
        navigator.geolocation.getCurrentPosition(
            function(position) {
                socket.emit('createLocationMessage', {
                    lng: position.coords.longitude,
                    lat: position.coords.latitude
                });
                locationButton.removeAttr('disabled');
                locationButton.text('Send Location');
            },
            function() {
                locationButton.removeAttr('disabled');
                locationButton.text('Send Location');                
                alert('Unable to find location');                       
            }
        );
    }
});