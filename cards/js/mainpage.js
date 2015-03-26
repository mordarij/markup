$(document).ready(function(){
    // $('a#sign-in').on('click', function(e){
    //     e.preventDefault();
    //     $('#registration-window, #forgot-password-window').fadeOut(0, function(){
    //         $('#authorization-window').fadeIn(0);
            
    //     });
    // });
    // $('a#sign-up').on('click', function(e){
    //     e.preventDefault();
    //     $('#authorization-window').fadeOut(0, function(){
    //         $('#registration-window').fadeIn(0);
    //     });
        
    // });
    // $('a#forgot-password').on('click', function(e){
    //     e.preventDefault();
    //     $('#authorization-window').fadeOut(0, function(){
    //         $('#forgot-password-window').fadeIn(0);
    //     });
    // });
    var $slider = $('.professionals .slider');
    var $wrapper = $slider.find('.wrapper');
    var $items = $wrapper.find('.item');
    var $itemWidth = $items.outerWidth() + parseInt($items.css('marginLeft'));
    var $wrapperWidth = $itemWidth * $items.length;
    var $controls = $slider.find('.controls');
    var slidesCount = Math.ceil($wrapperWidth / ($itemWidth * 4));
    for(var i = 0; i < slidesCount; i++){
        $controls.append('<div class="circle"></div>');
    }
    var $controlCircles = $controls.find('.circle');
    var currentIndex = 0;
    var timer;
    $controlCircles.eq(0).addClass('active');
    $slider.css({
        width: $itemWidth * 4 + 'px',
        marginLeft: 'auto',
        marginRight: 'auto',
        overflow: 'hidden'
    });
    $controlCircles.on('click', function(){
        var nextIndex = $(this).index('.circle');
        slideTo(nextIndex);
        clearInterval(timer);
        slideShow();
        console.log(nextIndex);
    });
    
    $wrapper.css('width', $wrapperWidth + 'px');
    slideShow();
    

    function slideShow(){
        timer = setInterval(function(){
            if(currentIndex < slidesCount - 1){
                slideTo(currentIndex + 1);
            }else{
                slideTo(0)
            }
            
        }, 6000);
    }

    function slideTo(index){
        $wrapper.stop().animate({
            left: (($itemWidth * 4) * (index)) * -1 - 1 + 'px'
        }, 1500, function(){
            currentIndex = index;
        });
        $controlCircles.eq(index)
            .addClass('active')
            .siblings('.circle').removeClass('active');
    }
});