
(function(){
  "use strict";

  if(window.BIRTHDAY_APP_INITIALIZED) return;
  window.BIRTHDAY_APP_INITIALIZED = true;

  const gift = document.getElementById("gift");
  const music = document.getElementById("music");
  const soundToggle = document.getElementById("soundToggle");
  const nextBtn = document.getElementById("nextBtn");

  const screen1 = document.getElementById("screen1");
  const screen2 = document.getElementById("screen2");
  const screen3 = document.getElementById("screen3");
  const screens = [screen1,screen2,screen3];

  const canvas = document.getElementById("fireworksCanvas");
  const ctx = canvas.getContext("2d");

  let opened = false;
  let celebrationStarted = false;
  let muted = false;
  let fireworksRunning = false;
  let fireworksFrame = 0;

  function setActiveScreen(target){
    screens.forEach(function(screen){
      screen.classList.toggle("active",screen === target);
      screen.classList.remove("is-leaving");
    });

    target.scrollTop = 0;
  }

  function animateScrollTo(screen,target,duration){
    const start = screen.scrollTop;
    const distance = target - start;

    if(Math.abs(distance) < 1) return;

    const startedAt = performance.now();

    function frame(now){
      const progress = Math.min(1,(now - startedAt) / duration);
      const eased = progress < .5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2,2) / 2;

      screen.scrollTop = start + distance * eased;

      if(progress < 1){
        requestAnimationFrame(frame);
      }
    }

    requestAnimationFrame(frame);
  }

  function keepVisible(screen,element){
    const screenRect = screen.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    const safeTop = screenRect.top + 68;
    const safeBottom = screenRect.bottom - 110;

    let target = screen.scrollTop;

    if(elementRect.bottom > safeBottom){
      target += elementRect.bottom - safeBottom;
    }else if(elementRect.top < safeTop){
      target -= safeTop - elementRect.top;
    }else{
      return;
    }

    const maxScroll = Math.max(0,screen.scrollHeight - screen.clientHeight);
    target = Math.max(0,Math.min(target,maxScroll));

    animateScrollTo(screen,target,2200);
  }

  function revealSequentially(screen,items,delay,onComplete){
    items.forEach(function(item){
      item.classList.remove("show");
    });

    items.forEach(function(item,index){
      setTimeout(function(){
        item.classList.add("show");

        setTimeout(function(){
          keepVisible(screen,item);
        },120);

        if(index === items.length - 1 && typeof onComplete === "function"){
          setTimeout(onComplete,850);
        }
      },index * delay);
    });
  }

  function startMusic(){
    music.volume = 0;

    const promise = music.play();

    if(promise && typeof promise.then === "function"){
      promise.then(function(){
        soundToggle.hidden = false;

        const startedAt = performance.now();
        const duration = 1800;

        function raise(now){
          const progress = Math.min(1,(now - startedAt) / duration);

          if(!muted){
            music.volume = progress * .82;
          }

          if(progress < 1){
            requestAnimationFrame(raise);
          }
        }

        requestAnimationFrame(raise);
      }).catch(function(){
        soundToggle.hidden = false;
        soundToggle.classList.add("is-muted");
      });
    }
  }

  soundToggle.addEventListener("click",function(){
    muted = !muted;
    music.muted = muted;
    soundToggle.classList.toggle("is-muted",muted);
    soundToggle.textContent = muted ? "×" : "♪";
    soundToggle.setAttribute("aria-label",muted ? "Включить музыку" : "Выключить музыку");
  });

  gift.addEventListener("click",function(){
    if(opened) return;
    opened = true;

    startMusic();
    screen1.classList.add("is-leaving");

    setTimeout(function(){
      setActiveScreen(screen2);

      const items = Array.from(screen2.querySelectorAll(".fade"));

      revealSequentially(screen2,items,1550,function(){
        nextBtn.hidden = false;
        nextBtn.classList.add("show");
        keepVisible(screen2,nextBtn);
      });
    },500);
  });

  nextBtn.addEventListener("click",startCelebration);

  function resizeCanvas(){
    const dpr = Math.min(window.devicePixelRatio || 1,2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(dpr,0,0,dpr,0,0);

    return {width:width,height:height};
  }

  function startCelebration(){
    if(celebrationStarted) return;
    celebrationStarted = true;

    nextBtn.hidden = true;
    screen2.classList.add("is-celebrating");
    canvas.style.display = "block";

    const viewport = resizeCanvas();
    const rockets = [];
    const particles = [];
    const colors = ["#ff6788","#ff9b73","#ffd26f","#8bd5dc","#d59cff"];

    let lastLaunch = 0;
    const startedAt = performance.now();
    fireworksRunning = true;

    function launchRocket(){
      rockets.push({
        x:viewport.width * (.12 + Math.random() * .76),
        y:viewport.height + 12,
        px:0,
        py:0,
        vx:(Math.random() - .5) * 1.25,
        vy:-(10.8 + Math.random() * 4.8),
        gravity:.135,
        targetY:viewport.height * (.14 + Math.random() * .34),
        color:colors[Math.floor(Math.random() * colors.length)]
      });
    }

    function explode(rocket){
      const count = viewport.width < 520 ? 72 : 104;

      for(let i=0;i<count;i+=1){
        const angle = (Math.PI * 2 * i) / count + Math.random() * .08;
        const speed = 1.8 + Math.random() * 4.7;

        particles.push({
          x:rocket.x,
          y:rocket.y,
          px:rocket.x,
          py:rocket.y,
          vx:Math.cos(angle) * speed,
          vy:Math.sin(angle) * speed,
          gravity:.042,
          friction:.982,
          alpha:1,
          decay:.009 + Math.random() * .012,
          width:1.1 + Math.random() * 1.4,
          color:rocket.color
        });
      }
    }

    function frame(now){
      if(!fireworksRunning) return;

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = .24;
      ctx.fillStyle = "rgba(28,19,30,.35)";
      ctx.fillRect(0,0,viewport.width,viewport.height);

      const elapsed = now - startedAt;

      if(elapsed < 4300 && now - lastLaunch > 420){
        lastLaunch = now;
        launchRocket();

        if(Math.random() > .63){
          setTimeout(launchRocket,130);
        }
      }

      for(let i=rockets.length - 1;i>=0;i-=1){
        const rocket = rockets[i];

        rocket.px = rocket.x;
        rocket.py = rocket.y;
        rocket.x += rocket.vx;
        rocket.y += rocket.vy;
        rocket.vy += rocket.gravity;

        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = .92;
        ctx.strokeStyle = rocket.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rocket.px || rocket.x,rocket.py || rocket.y + 14);
        ctx.lineTo(rocket.x,rocket.y);
        ctx.stroke();

        ctx.fillStyle = "#fff7d4";
        ctx.beginPath();
        ctx.arc(rocket.x,rocket.y,2.7,0,Math.PI * 2);
        ctx.fill();

        if(rocket.y <= rocket.targetY || rocket.vy >= -1.4){
          explode(rocket);
          rockets.splice(i,1);
        }
      }

      for(let i=particles.length - 1;i>=0;i-=1){
        const particle = particles[i];

        particle.px = particle.x;
        particle.py = particle.y;
        particle.vx *= particle.friction;
        particle.vy = particle.vy * particle.friction + particle.gravity;
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.alpha -= particle.decay;

        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = Math.max(0,particle.alpha);
        ctx.strokeStyle = particle.color;
        ctx.lineWidth = particle.width;
        ctx.beginPath();
        ctx.moveTo(particle.px,particle.py);
        ctx.lineTo(particle.x,particle.y);
        ctx.stroke();

        if(particle.alpha <= 0){
          particles.splice(i,1);
        }
      }

      fireworksFrame = requestAnimationFrame(frame);
    }

    fireworksFrame = requestAnimationFrame(frame);

    setTimeout(function(){
      fireworksRunning = false;
      cancelAnimationFrame(fireworksFrame);

      rockets.length = 0;
      particles.length = 0;

      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      ctx.clearRect(0,0,viewport.width,viewport.height);

      canvas.width = canvas.width;
      canvas.style.display = "none";

      screen2.classList.remove("active","is-celebrating");
      setActiveScreen(screen3);

      const items = Array.from(screen3.querySelectorAll(".fade"));
      revealSequentially(screen3,items,2100);
    },5000);
  }

  window.addEventListener("resize",function(){
    if(fireworksRunning){
      resizeCanvas();
    }
  });

  document.addEventListener("visibilitychange",function(){
    if(document.hidden && !music.paused){
      music.pause();
    }else if(!document.hidden && opened && !muted){
      music.play().catch(function(){});
    }
  });

  /* Локальный автотест: index.html?test=1 */
  if(location.search.indexOf("test=1") !== -1){
    setTimeout(function(){gift.click();},400);
    setTimeout(function(){nextBtn.click();},10500);
  }
})();
