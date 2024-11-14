import $ from "jquery";
import { gsap } from "gsap";
import ScrollTrigger from "gsap/ScrollTrigger";

window.$ = $;

gsap.registerPlugin(ScrollTrigger);
const mm = gsap.matchMedia();

function GenerateTimeline(trigger, start, end, markers, ease) {
  return gsap.timeline({
    scrollTrigger: {
      trigger,
      pin: false,
      start,
      end,
      scrub: 1,
      markers,
      ease,
      invalidateOnRefresh: true,
    },
  });
}

export function TerminalAnim() {
  const tl = GenerateTimeline(
    ".js-hero",
    "top top",
    "+=60",
    false,
    "power1.inOut",
  );

  tl.addLabel("start").to(".js-terminal", { y: 10 }, "start").fromTo(
    ".js-terminal-row",
    {
      opacity: 0,
      y: 5,
    },
    { opacity: 1, y: 0, stagger: 0.72 },
    "start",
  );
}

export function PresentationAnim() {
  const targets = $(".js-slide");

  for (let i = 0; i < targets.length; i++) {
    const tl = GenerateTimeline(
      targets[i],
      "10% 10%",
      "80%",
      false,
      "power2.out",
    );

    if (i < targets.length - 1) {
      tl.addLabel("start")
        .to($(targets[i]), { scale: 0.96 + 0.02 * i, y: `${2 * i}%` }, "start")
        .to($(targets[i]).find(".js-slide-cover"), { opacity: 0.48 }, "start");
    }

    if (i === targets.length - 1) {
      tl.addLabel("start").to(
        $(targets[i]),
        { scale: 0.96 + 0.02 * i, y: `${2 * i}%` },
        "start",
      );
    }
  }
}

export function TilesAnim() {
  const targets = $(".js-tiles");
  const tl = GenerateTimeline(targets, "+=20% 75%", "10%", false, "power1.in");

  mm.add("(min-width: 768px)", () => {
    $(".js-tile").css({ opacity: 0 });

    tl.addLabel("start").to(
      $(".js-tile"),
      { opacity: 1, stagger: 0.48 },
      "start",
    );

    return () => {
      $(".js-tile").css({ opacity: 1 });
    };
  });

  mm.add("(max-width: 767px)", () => {
    $(".js-tile").css({ opacity: 1 });

    return () => {
      $(".js-tile").css({ opacity: 0 });

      tl.addLabel("start").to(
        $(".js-tile"),
        { opacity: 1, stagger: 0.48 },
        "start",
      );
    };
  });
}

export function ModalContent(target) {
  const modalContent = $("#js-modal-content");
  modalContent.clone().appendTo("#js-modal-body .modal__body__wrapper");

  const modalContentCopy = $(".modal__body__inner")[0];
  $(modalContentCopy).css({
    position: "absolute",
    width: "100%",
    height: "100%",
  });

  gsap.to(modalContentCopy, {
    x: "-51%",
    opacity: 0,
    duration: 0.32,
    onComplete: () => {
      $(modalContentCopy).remove();
    },
  });
}

export function MagneticButton() {
  const tiles = $(".js-tile");

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];

    tile.addEventListener("mousemove", function (e) {
      let boundingRect = tile.getBoundingClientRect();

      const mousePosX = e.clientX - boundingRect.left;
      const mousePosY = e.clientY - boundingRect.top;

      gsap.to($(tile).find(".js-tile-inner"), {
        x: (mousePosX - boundingRect.width / 2) * 0.03,
        y: (mousePosY - boundingRect.height / 2) * 0.03,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.to($(tile), {
        x: -(mousePosX - boundingRect.width / 2) * 0.015,
        y: -(mousePosY - boundingRect.height / 2) * 0.015,
        duration: 0.8,
        ease: "power3.out",
      });
    });

    tile.addEventListener("mouseleave", () => {
      gsap.to($(tile).find(".js-tile-inner"), {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1,0.3)",
      });
      gsap.to($(tile), {
        x: 0,
        y: 0,
        duration: 0.8,
        ease: "elastic.out(1,0.3)",
      });
    });
  }
}

export function SlideAnim() {
  const targets = $(".js-statement");

  for (let i = 0; i < targets.length; i++) {
    const target = targets[i];
    const targetRotation = $(target).data("rotation");

    const tl = GenerateTimeline(
      targets,
      "-=20% center",
      "+10% 55%",
      false,
      "none",
    );

    if ($(window).width() >= 1024) {
      if (i == 0) {
        tl.fromTo(
          $(target),
          { x: "100%", rotate: targetRotation },
          { x: 0, rotate: 0 },
        );
      }

      if (i == 2) {
        tl.fromTo(
          $(target),
          { x: "-100%", rotate: targetRotation },
          { x: 0, rotate: 0 },
        );
      }
    }
  }
}

export function InitAnim() {
  PresentationAnim();
  TerminalAnim();
  TilesAnim();
  MagneticButton();
  SlideAnim();

  $(window).on("resize", function () {
    SlideAnim();
  });
}
