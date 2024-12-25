// ==UserScript==
// @name         YouTube Random Video Button
// @namespace    http://tampermonkey.net/
// @version      1.0.1
// @description  Adds a "Random Video" button to YouTube to watch a random video.
// @author       Mitul Patel
// @match        https://www.youtube.com/*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  function getRandomQuery() {
    const characters =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const length = (crypto.getRandomValues(new Uint8Array(1))[0] % 5) + 3;
    const randomBytes = new Uint8Array(length);
    crypto.getRandomValues(randomBytes);

    let query = "";
    for (let i = 0; i < length; i++) {
      let randomValue;
      do {
        randomValue = randomBytes[i];
      } while (randomValue >= 256 - (256 % characters.length));

      query += characters[randomValue % characters.length];
    }

    return query;
  }

  async function goToRandomVideo() {
    const button = document.querySelector("#random-video-btn");
    if (button) {
      button.disabled = true;
      button.textContent = "Loading...";
    }

    try {
      const queries = Array.from({ length: 3 }, getRandomQuery);
      const allVideoIds = new Set();

      await Promise.all(
        queries.map(async (query) => {
          try {
            const response = await fetch(
              `https://www.youtube.com/results?search_query=${encodeURIComponent(
                query
              )}`
            );
            if (!response.ok)
              throw new Error(`HTTP error! status: ${response.status}`);

            const html = await response.text();
            const videoIdMatch = html.match(/"videoId":"(.*?)"/);
            if (videoIdMatch && videoIdMatch[1]) {
              allVideoIds.add(videoIdMatch[1]);
            }
          } catch (err) {
            console.error(`Error fetching query "${query}":`, err);
          }
        })
      );

      if (allVideoIds.size === 0) {
        throw new Error("No videos found across any queries");
      }

      const videoIds = Array.from(allVideoIds);
      const randomBytes = new Uint8Array(1);
      let selectedIndex;

      do {
        crypto.getRandomValues(randomBytes);
        selectedIndex = randomBytes[0];
      } while (selectedIndex >= 256 - (256 % videoIds.length));

      selectedIndex = selectedIndex % videoIds.length;
      window.location.href = `https://www.youtube.com/watch?v=${videoIds[selectedIndex]}`;
    } catch (err) {
      console.error("Error fetching random videos:", err);
      alert("Failed to fetch random videos. Please try again in a moment.");
      if (button) {
        button.disabled = false;
        button.textContent = "Random Video";
      }
    }
  }

  function addRandomButton() {
    const navBar = document.querySelector("#end");
    if (navBar && !document.querySelector("#random-video-btn")) {
      const button = document.createElement("button");
      button.id = "random-video-btn";
      button.textContent = "Random Video";
      button.style.cssText = `
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 10px 16px;
                font-size: 14px;
                font-weight: 500;
                color: white;
                background-color: #272727;
                border: none;
                border-radius: 50px;
                cursor: pointer;
                margin-right: 10px;
                box-shadow: 0px 1px 2px rgba(0, 0, 0, 0.2);
                transition: background-color 0.3s ease;
            `;
      button.onmouseover = () => {
        button.style.backgroundColor = "#383838";
      };
      button.onmouseout = () => {
        button.style.backgroundColor = "#272727";
      };
      button.onclick = goToRandomVideo;

      navBar.prepend(button);
    }
  }

  const observer = new MutationObserver(addRandomButton);
  observer.observe(document.body, { childList: true, subtree: true });

  addRandomButton();
})();
