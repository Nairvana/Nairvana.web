
(function($){
	'use script';




	var $loader = $('#preloader');
    if($loader.length > 0){
		$(window).on('load', function(event) {
	        $('#preloader').delay(500).fadeOut(500);
		});
	}


	

	// Scroll Area
	$(document).ready(function(){
	    $('.scroll-area').click(function(){
	      	$('html').animate({
	        	'scrollTop' : 0,
	      	},700);
	      	return false;
	    });
	    $(window).on('scroll',function(){
	      	var a = $(window).scrollTop();
	      	if(a>400){
	            $('.scroll-area').slideDown(300);
	        }else{
	            $('.scroll-area').slideUp(200);
	        }
	    });
	});

	///banner
	var $banner = $('.slider-area-full');
    if($banner.length > 0){
   		var $full = $('.slider-area-full');
		    if($full.length > 0){
			    $(document).ready(function(){
				  	$(".slider-area-full").owlCarousel({
				  		loop:true,
				  		center:true,
				  		items:1,
				  		autoplay: true,
				  		nav: false,
				  	});
				});
			}
		}

		$('.technology-video a').magnificPopup({
		  	type: 'iframe',
		});


		
		//sponser
	var $sponser = $('.sponser-slider');
    if($sponser.length > 0){
	$(document).ready(function(){
	  	$(".sponser-slider").owlCarousel({
	  		loop:true,
	  		items:4,
	  		autoplay: true,
	  		nav: false,
	  		responsive : {
			    // breakpoint from 0 up
			    0 : {
			       items:2,
			    },
			    
			    // breakpoint from 768 up
			    768 : {
			         items:4,
			    },
			     991 : {
			         items:4,
			    }
			}
	  	});
	});

	}
	

	// Sticky Menu
	$(document).ready(function(){
		$(window).on('scroll',function(){
			var scroll = $(window).scrollTop();
			if(scroll<10){
				$('.header-area').removeClass('sticky');
			}else{
				$('.header-area').addClass('sticky');
			}
		});
	});


	///counter
		var $count = $('.count');
    	if($count.length > 0){
			$(document).ready(function(){
				$('.count').counterUp({
					delay: 10,
					time: 1000
				});

			});
		}

	//clints
	var $testimonial = $('.testimonial-slider');
    	if($testimonial.length > 0){
	$(document).ready(function(){
	  	$(".testimonial-slider").owlCarousel({
	  		loop:true,
	  		items:1,
	  		autoplay: true,
	  		nav: false,
	  		responsive : {
			    // breakpoint from 0 up
			    0 : {
			       items:1,
			    },
			    
			    // breakpoint from 768 up
			    768 : {
			         items:1,
			    },
			     991 : {
			         items:1,
			    }
			}
	  	});
	});

	}

}(jQuery));

(()=>{
	
const openNavMenu=document.querySelector(".open-nav-menu"),
 closeNavMenu=document.querySelector(".close-nav-menu"),
 navMenu=document.querySelector(".nav-menu"),
 menuOverlay=document.querySelector(".menu-overly"),
 mediaSize=991;
	
	openNavMenu.addEventListener("click", toggleNav);
	closeNavMenu.addEventListener("click", toggleNav);

	menuOverlay.addEventListener("click", toggleNav);

	function toggleNav(){
		navMenu.classList.toggle("open");
		menuOverlay.classList.toggle("active");
		document.body.classList.toggle("hidden-scrolling");
	}
	navMenu.addEventListener("click",(event)=>{
		if (event.target.hasAttribute("data-toggle") && window.innerWidth<=mediaSize) {
			//prevent default ancor click behavior
			event.preventDefault();
			const menuIteamHasChildren=event.target.parentElement;
			//if menuIteamHasChildren is already ecpanded collapse it
			if (menuIteamHasChildren.classList.contains("active")){
				collapseSubMenu();
			}
			else{
				//collapse exting expanded menuIteamHasChildren
			if(navMenu.querySelector(".menu-iteam-has-childrean.active")){
				collapseSubMenu();
			}
			//expand new menuIteamHasChildren
			menuIteamHasChildren.classList.add("active");
			const subMenu=menuIteamHasChildren.querySelector(".submenu");
			subMenu.style.maxHeight=subMenu.scrollHeight + "px";
		}
		}
	});
	function collapseSubMenu(){
		navMenu.querySelector(".menu-iteam-has-childrean.active .submenu")
		.removeAttribute("style");
		navMenu.querySelector(".menu-iteam-has-childrean.active")
		.classList.remove("active");
	}

	function resizeFix(){
		if (navMenu.classList.contains("open")) {
			toggleNav();
		}	
		if(navMenu.querySelector(".menu-iteam-has-childrean.active")){
				collapseSubMenu();
		}
	}
	window.addEventListener("resize",function(){
		if (this.innerWidth > mediaSize) {
			resizeFix();
		}

	});




})();
	