import { gsap } from "gsap";
import $ from "jquery";
import { InitAnim } from "./animation";

// Find all ligatures and apply ligature class to ensure maintaining them
const ligatures = ["ffi", "ft", "fi", "ff"];
const modalHtml = `<div id="js-modal" class="modal"> <div id="js-modal-inner" class="modal__inner"><div class="modal__header"> <div class="modal__header__action"></div> <div class="modal__stripe"> <hr /> <hr /> <hr /> <hr /> </div> <div class="modal__header__title flex items-center justify-center"> <span class="mono font-small">What is Clan</span> </div> <div class="modal__stripe"> <hr /> <hr /> <hr /> <hr /> </div> <div id="js-modal-close" class="modal__header__action"> <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg" > <path d="M0 0H1.14286V1.14286H0V0ZM2.28571 2.28571H1.14286V1.14286H2.28571V2.28571ZM3.42857 3.42857H2.28571V2.28571H3.42857V3.42857ZM4.57143 3.42857H3.42857V4.57143H2.28571V5.71429H1.14286V6.85714H0V8H1.14286V6.85714H2.28571V5.71429H3.42857V4.57143H4.57143V5.71429H5.71429V6.85714H6.85714V8H8V6.85714H6.85714V5.71429H5.71429V4.57143H4.57143V3.42857ZM5.71429 2.28571V3.42857H4.57143V2.28571H5.71429ZM6.85714 1.14286V2.28571H5.71429V1.14286H6.85714ZM6.85714 1.14286V0H8V1.14286H6.85714Z" fill="#162324" /> </svg> </div> </div> <div id="js-modal-body" class="modal__body"><div class="modal__body__wrapper"><div id="js-modal-content" class="modal__body__inner"></div></div></div></div><div id="js-modal-backdrop" class="modal__backdrop"></div></div>`;
const tiles = document.getElementsByClassName("js-modal");

InitAnim();

function removeModal() {
  document
    .getElementById("js-modal-close")
    .addEventListener("click", function () {
      document.getElementById("js-modal").remove();
    });

  document
    .getElementById("js-modal-backdrop")
    .addEventListener("click", function () {
      document.getElementById("js-modal").remove();
    });
}

function createModal(tile, idx) {
  if (tile.dataset.long === "") return;
  const data = {
    title: tile.getElementsByClassName("tile__headline")[0].cloneNode(true),
    description: tile.getElementsByClassName("tile__description")[0].innerHTML,
    long: tile.dataset.long,
  };

  if (!document.getElementById("js-modal")) {
    const div = document.createElement("div");
    div.innerHTML = modalHtml.trim();
    document.body.append(div.firstChild);
  }

  const h3 = document.createElement("p");
  const p = document.createElement("div");

  h3.innerHTML = data.description;
  p.classList = "tile__description body";
  p.innerHTML = data.long;

  document.getElementById("js-modal-content").appendChild(data.title);
  document.getElementById("js-modal-content").appendChild(h3);
  document.getElementById("js-modal-content").appendChild(p);

  generateFooter(idx, tiles);
  removeModal();
}

function generateFooter(idx, tiles) {
  function getNextIndex(idx, tilesLength) {
    return tilesLength - 1 === idx ? 0 : idx + 1;
  }

  function getPrevIndex(idx, tilesLength) {
    return idx === 0 ? tilesLength - 1 : idx - 1;
  }

  const nextId = getNextIndex(idx, tiles.length);
  const prevId = getPrevIndex(idx, tiles.length);

  const next = tiles[nextId]
    .getElementsByClassName("tile__headline")[0]
    .cloneNode(true);
  const prev = tiles[prevId]
    .getElementsByClassName("tile__headline")[0]
    .cloneNode(true);

  const divFooter = document.createElement("div");
  divFooter.id = "js-modal-footer";
  divFooter.classList = "modal__footer";

  next.classList += " js-modal-footer";
  prev.classList += " js-modal-footer";

  document.getElementById("js-modal-content").appendChild(divFooter);
  document.getElementById("js-modal-footer").appendChild(prev);
  document.getElementById("js-modal-footer").appendChild(next);

  next.addEventListener("click", function (e) {
    const modalContent = $("#js-modal-content");

    modalContent.clone().appendTo("#js-modal-body .modal__body__wrapper");

    const modalContentCopy = $(".modal__body__inner")[0];
    const modalContentOrig = $(".modal__body__inner")[1];

    $(modalContentCopy).removeAttr("id");
    $(modalContentCopy).find("#js-modal-footer").removeAttr("id");
    $(modalContentOrig).empty();

    createModal(tiles[nextId], nextId);

    $(modalContentCopy).css({
      position: "absolute",
      width: "100%",
      height: "100%",
    });

    gsap.to(modalContentCopy, {
      x: "-10%",
      opacity: 0,
      duration: 0.32,
      onComplete: () => {
        $(modalContentCopy).remove();
      },
    });

    gsap.from(modalContentOrig, {
      x: "10%",
      opacity: 0,
      duration: 0.32,
      delay: 0.24,
    });
  });

  prev.addEventListener("click", function () {
    // document.getElementById("js-modal-content").innerHTML = "";
    // createModal(tiles[prevId], prevId);
    const modalContent = $("#js-modal-content");

    modalContent.clone().appendTo("#js-modal-body .modal__body__wrapper");

    const modalContentCopy = $(".modal__body__inner")[0];
    const modalContentOrig = $(".modal__body__inner")[1];

    $(modalContentCopy).removeAttr("id");
    $(modalContentCopy).find("#js-modal-footer").removeAttr("id");
    $(modalContentOrig).empty();

    createModal(tiles[nextId], nextId);

    $(modalContentCopy).css({
      position: "absolute",
      width: "100%",
      height: "100%",
    });

    gsap.to(modalContentCopy, {
      x: "10%",
      opacity: 0,
      duration: 0.32,
      onComplete: () => {
        $(modalContentCopy).remove();
      },
    });

    gsap.from(modalContentOrig, {
      x: "-10%",
      opacity: 0,
      duration: 0.32,
      delay: 0.24,
    });
  });
}

function modal(tiles) {
  if (tiles.length !== 0) {
    for (let i = 0; i <= tiles.length; i++) {
      const tile = tiles[i];
      $(tile).on("click", function (e) {
        createModal(tile, i);
      });
    }
  }
}

function findAllLigatures() {
  const ligatureEls = document.querySelectorAll(".js-find-ligatures");

  ligatureEls.forEach((el) => {
    console.log(el);
    highlightText(el, ligatures, "ligature");
  });
}

function highlightText(el, substrings, classNames) {
  substrings.forEach((substring) => {
    const regex = new RegExp(`(${substring})`, "gi");
    el.childNodes.forEach((childNode) => {
      if (childNode.nodeValue && regex.test(childNode.nodeValue)) {
        childNode.parentNode.innerHTML = childNode.parentNode.innerHTML.replace(
          regex,
          `<span class="${classNames}">${substring}</span>`,
        );
      }
    });
  });
}

function showResponsiveMenu() {
  const hiddenClass = "res-menu__nav--hidden";
  const target = $("#js-res-menu-caller");
  const targetChild = target.children("#js-res-menu-nav");
  const targetChildren = $(targetChild).find(".js-menu-item");

  target.on("click", function () {
    if ($(targetChild).hasClass(hiddenClass)) {
      $(targetChild).removeClass(hiddenClass);

      $(target).find(".js-res-menu-close").removeClass("opacity-0");
      $(target).find(".js-res-menu-menu").addClass("opacity-0");

      gsap.fromTo(
        targetChildren,
        { opacity: 0, y: "20%" },
        { opacity: 1, y: "0%", stagger: 0.16 },
      );
    } else if (!$(targetChild).hasClass(hiddenClass)) {
      $(target).find(".js-res-menu-close").addClass("opacity-0");
      $(target).find(".js-res-menu-menu").removeClass("opacity-0");

      gsap.fromTo(
        targetChildren,
        { opacity: 1 },
        {
          opacity: 0,
          y: "20%",
          stagger: 0.08,
          onComplete: () => {
            $(targetChild).addClass(hiddenClass);
          },
        },
      );
    }
  });
}

function responsiveMenu() {
  const hiddenClass = "res-menu--hidden";
  const target = $("#js-res-menu-caller");
  const windowWidth = $(window).width();
  const windowHeight = $(window).height();

  if (windowWidth < 768) {
    if ($(target).hasClass(hiddenClass)) {
      $(target).removeClass(hiddenClass);
    }
    $(target).css({ top: windowHeight - ($(target).height() + 16), right: 16 });
  } else if (windowWidth >= 768) {
    if (!$(target).hasClass(hiddenClass)) {
      $(target).addClass(hiddenClass);
    }
  }
}

findAllLigatures();
modal(tiles);
responsiveMenu();

if ($("#js-res-menu-caller")) {
  showResponsiveMenu();
}

$(window).on("resize", function () {
  responsiveMenu();
});
