// UMD Schedule of Classes
const contentContainerClass = ".soc-content-container";
// PLaceholder for professor that hasn't been assigned
const instructorHidderClasses = ".hidden.section-deliveryFilter"; // Element that stops instructor from being displayed
// Container holding the instructor name
// Span holding instructor name
// PlanetTerp
const baseApiCallPlanetTerp = "https://planetterp.com/api/v1/professor?name=";
const ratingPlanetTerpClass = ".rating-planet-terp"; // Class for planet terp rating objects
const logoPlanetTerpPath = "https://planetterp.com/static/images/logo.png"; // Goes next to rating
const planetTerpBlue = "#0099FC"; // Color of planetTerp logo
// RateMyProfessor
const baseApiCallRateMyProfessor =
  "https://www.ratemyprofessors.com/search/teachers?sid=U2Nob29sLTEyNzA=&query=";
const ratingRateMyProfessorClass = ".rating-rate-my-professor"; // Class for RMP rating objects
const logoRateMyProfessorPath =
  "https://www.ratemyprofessors.com/static/media/small_rmp_logo_white.4d5ff7fa.svg";
const rateMyProfessorBlue = "#41aef4"; //Color of RMP logo

// CORS proxy
const proxy = "https://nextjs-cors-anywhere.vercel.app/api?endpoint=";

const profInfo = {}; // Store professor ratings, links, slug, etc

/**
 * Returns the names of all the professors on the page
 */
function getProfessors() {
  const names = new Set();
  const profs = document.querySelectorAll(".section-instructor");

  for (const prof of profs) {
    // Support for n profs seperated by a comma
    prof.childNodes[0].textContent
      .split(",")
      .filter((name) => name !== "Instructor: TBA")
      .forEach((name) => {
        names.add(name.trim());
      });
  }
  return names;
}

/**
 * Fetch average rating for a given professor from Planet Terps API
 * and add to professorRatings
 *
 * @param {*} name Professor's name (first last)
 */
async function getInfoPT(name) {
  // Encode the name for the api call using URLParameterEncoding
  /* Fetch professor ratings from Planet Terp */
  await fetch(baseApiCallPlanetTerp + encodeURIComponent(name))
    .then((r) => r.json())
    .then((result) => {
      if ("error" in result && result["error"] === "professor not found") {
        throw new Error("Professor not found");
      }
      profInfo[name]["pt"] = {};
      profInfo[name]["pt"]["rating"] = result["average_rating"];
      profInfo[name]["pt"][
        "url"
      ] = `https://planetterp.com/professor/${result["slug"]}`;
    })
    .catch((error) => {
      console.log(
        "Could not get data about " + name + " from Planet Terp. ",
        error
      );
      /* Couldn't find professor */
      profInfo[name]["pt"] = null;
    });
}

async function getInfoRMP(name) {
  let apiCall = baseApiCallRateMyProfessor + encodeURIComponent(name);
  //set the request's mode to 'no-cors

  await fetch(proxy + apiCall)
    .then((r) => r.text())
    .then((result) => {
      // Find the index where "window.__RELAY_STORE__ = " appears, then get the json string between the next matching { and }

      jsonString = JSON.stringify(result);
      let startIndex = jsonString.indexOf('avgRating\\\\\\":');
      let avgRating = NaN;
      let legacyId = NaN;
      //save the avg rating
      if (startIndex !== -1) {
        const endIndex = jsonString.indexOf(",", startIndex);
        avgRating = parseFloat(jsonString.substring(startIndex + 14, endIndex));
      }
      startIndex = jsonString.indexOf('legacyId\\\\\\":');
      //save legacy id
      if (startIndex !== -1) {
        const endIndex = jsonString.indexOf(",", startIndex);
        legacyId = parseFloat(jsonString.substring(startIndex + 13, endIndex));
      }

      profInfo[name]["rmp"] = {};
      profInfo[name]["rmp"]["rating"] = avgRating;
      profInfo[name]["rmp"]["url"] =
        `https://www.ratemyprofessors.com/professor/` + legacyId;
      url = `https://www.ratemyprofessors.com/professor/` + legacyId;
      fetch(url)
        .then((response) => response.text())
        .then((html) => {
          let doc = new DOMParser().parseFromString(html, "text/html");
          let div = doc.querySelector(
            ".RatingValue__Numerator-qw8sqy-2.liyUjw"
          );
          let number = parseFloat(div.textContent);
          console.log(number);
        });
    })
    .catch((error) => {
      console.log(
        "Could not get data about " + name + " from Rate My Professor. ",
        error
      );
      profInfo[name]["rmp"] = null;
    });
}

function displayRatingPT(name) {
  const sectionInfos = [
    ...document.querySelectorAll(".section-instructor"),
  ].filter((e) => e.textContent === name);
  for (const section of sectionInfos) {
    // Remove all elements with 'rating-loading' class
    if (section.nextSibling.className === "rating-loading") {
      section.nextSibling.remove();
      console.log("removed loading");
    }

    // Remove ratings if already added
    section.querySelectorAll(ratingPlanetTerpClass).forEach((e) => e.remove());

    if (profInfo[name]["pt"] != null) {
      // Create a container for the PT rating and logo
      const ratingContainer = document.createElement("span");
      ratingContainer.className = "rating-container-pt";

      // Place an image next to rating with Planet Terp logo
      // also with link to professor reviews on Planet Terp
      const imageLink = document.createElement("a");
      imageLink.href = profInfo[name]["pt"]["url"];
      const image = document.createElement("img");
      image.src = chrome.runtime.getURL(logoPlanetTerpPath);
      image.style.marginLeft = "5px";
      image.style.marginRight = "3px";
      imageLink.appendChild(image);
      ratingContainer.appendChild(imageLink);

      // Create display element with link to professor reviews
      const node = document.createElement("a");
      const rating = profInfo[name]["pt"]["rating"]
        ? profInfo[name]["pt"]["rating"].toFixed(2)
        : "N/A";
      const textNode = document.createTextNode(rating);
      node.appendChild(textNode);
      node.href = profInfo[name]["pt"]["url"];
      node.target = "_blank";
      node.className = "rating-planet-terp";
      node.style.color = planetTerpBlue;
      ratingContainer.appendChild(node);

      // Add the PT rating container to the section
      section.appendChildx(ratingContainer);
    }
  }
}

function displayRatings(name) {
  const sectionInfos = [
    ...document.querySelectorAll(".section-instructor"),
  ].filter((e) => e.textContent.includes(name));
  for (const section of sectionInfos) {
    // Remove all elements with 'rating-loading' class
    if (
      section.nextSibling &&
      section.nextSibling.className === "rating-loading"
    ) {
      section.nextSibling.remove();
      console.log("removed loading");
    }

    // Remove ratings if already added
    section.querySelectorAll(ratingPlanetTerpClass).forEach((e) => e.remove());
    section
      .querySelectorAll(ratingRateMyProfessorClass)
      .forEach((e) => e.remove());

    // Display Planet Terp rating
    if (profInfo[name]["pt"] != null) {
      // Create a container for the PT rating and logo
      const ratingContainer = document.createElement("span");
      ratingContainer.className = "rating-container-pt";

      // Add PT rating and logo to the container
      createRatingElement(
        section,
        ratingContainer,
        profInfo[name]["pt"],
        ratingPlanetTerpClass,
        logoPlanetTerpPath,
        planetTerpBlue
      );

      // Add the PT rating container to the section
      section.appendChild(ratingContainer);
    }

    // Display Rate My Professor rating
    if (profInfo[name]["rmp"] != null) {
      // Create a container for the RMP rating and logo
      const ratingContainer = document.createElement("span");
      ratingContainer.className = "rating-container-rmp";

      // Add RMP rating and logo to the container
      createRatingElement(
        section,
        ratingContainer,
        profInfo[name]["rmp"],
        ratingRateMyProfessorClass,
        logoRateMyProfessorPath,
        rateMyProfessorBlue
      );

      // Add the RMP rating container to the section
      section.appendChild(ratingContainer);
    }
  }
}

function showLoading(name) {
  const sectionInfos = [
    ...document.querySelectorAll(".section-instructor"),
  ].filter((e) => e.innerText === name);
  for (const section of sectionInfos) {
    const node = document.createElement("span");
    const textNode = document.createTextNode("Ratings Loading...");
    node.appendChild(textNode);
    node.className = "rating-loading";
    node.style.color = "grey";
    section.parentNode.insertBefore(node, section.nextSibling);
  }
}

function createRatingElement(
  section,
  ratingContainer,
  ratingInfo,
  ratingClass,
  logoPath,
  color
) {
  // Place an image next to rating with the appropriate logo, and link to professor reviews
  const imageLink = document.createElement("a");
  imageLink.href = ratingInfo["url"];
  const image = document.createElement("img");
  image.src = logoPath;
  image.style.marginLeft = "5px";
  image.style.marginRight = "3px";
  image.style.height = "16px";
  imageLink.appendChild(image);
  ratingContainer.appendChild(imageLink);

  // Create display element with link to professor reviews
  const node = document.createElement("a");
  const rating = ratingInfo["rating"] ? ratingInfo["rating"].toFixed(2) : "N/A";
  const textNode = document.createTextNode(rating);
  node.appendChild(textNode);
  node.href = ratingInfo["url"];
  node.target = "_blank";
  node.className = ratingClass;
  node.style.color = color;
  ratingContainer.appendChild(node);
}

// Update updateRatings function to call displayRatings instead of separate display functions
async function updateRatings() {
  // Get professors visible on page
  const names = getProfessors();
  const fetches = [];
  const displayedNames = Object.keys(profInfo);

  for (const name of names) {
    if (!displayedNames.includes(name)) {
      profInfo[name] = {};
      showLoading(name);
      fetches.push(getInfoPT(name));
      fetches.push(getInfoRMP(name));
    }
  }

  await Promise.all(fetches);

  for (const name of names) {
    if (!displayedNames.includes(name)) {
      displayRatings(name);
    }
  }
}

/* Display ratings for all professors
    that are initially visiable */
window.addEventListener("load", updateRatings);

/* Observe if professors become visible */
const observer = new MutationObserver((mutations) => {
  mutations.forEach(function (mutation) {
    if (mutation.attributeName !== "style") return;
    if (mutation.target.className !== "hidden section-deliveryFilter") return;
    updateRatings();
  });
});

/* Get all elements that control whether professors are visible */
/* Monitor entire subtree for attribute changes */
observer.observe(document.querySelector(contentContainerClass), {
  subtree: true,
  attributes: true,
});

//save the original order for reset
var originalOrder = [];

/* This will run addGPA() once page loads */
window.addEventListener("load", function () {
  addGPA();
});

/* Adding the font 'Font Awesome' to the page! */
var getFont = document.createElement("link");
getFont.setAttribute(
  "href",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.9.0/css/all.min.css"
);
getFont.setAttribute("rel", "stylesheet");

document.head.appendChild(getFont);

/* These global variables are used to assign unique ids to each professor and course */
var currIndex = 0;
var courseIndex = 0;

let instructorsData = new Map();

/* Causes a pause depending on argument, ms. Note: 1000ms = 1s */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sortGPA(isUp) {
  var coursePrefixContainers = document.querySelectorAll(
    ".course-prefix-container"
  );
  var allCourses = [];

  // Combine all the courses from each course-prefix-container
  for (var i = 0; i < coursePrefixContainers.length; i++) {
    var containerCourses = Array.from(
      coursePrefixContainers[i].querySelectorAll(".course")
    );
    allCourses = allCourses.concat(containerCourses);
  }

  // Sort the courses by their GPA value
  if (isUp) {
    allCourses.sort(function (a, b) {
      var aCircle = a.querySelector(".circle");
      var bCircle = b.querySelector(".circle");
      var aGPA = aCircle
        ? parseFloat(aCircle.textContent.split("GPA: ")[1])
        : 0;
      var bGPA = bCircle
        ? parseFloat(bCircle.textContent.split("GPA: ")[1])
        : 0;
      return bGPA - aGPA;
    });
  } else {
    allCourses.sort(function (a, b) {
      var aCircle = a.querySelector(".circle");
      var bCircle = b.querySelector(".circle");
      var aGPA = aCircle
        ? parseFloat(aCircle.textContent.split("GPA: ")[1])
        : 0;
      var bGPA = bCircle
        ? parseFloat(bCircle.textContent.split("GPA: ")[1])
        : 0;
      return aGPA - bGPA;
    });
  }

  // Remove all course-prefix-container elements except the first one
  for (var i = 1; i < coursePrefixContainers.length; i++) {
    coursePrefixContainers[i].remove();
  }

  // Clear the courses-container of the first course-prefix-container
  var firstCoursesContainer =
    coursePrefixContainers[0].querySelector(".courses-container");
  while (firstCoursesContainer.firstChild) {
    firstCoursesContainer.removeChild(firstCoursesContainer.firstChild);
  }

  // Append the sorted courses to the first courses-container
  for (var i = 0; i < allCourses.length; i++) {
    firstCoursesContainer.appendChild(allCourses[i]);
  }
  // Replace the text of the course-prefix-name element with "Sorted classes"
  var firstCoursePrefixName = coursePrefixContainers[0].querySelector(
    ".course-prefix-name"
  );
  if (firstCoursePrefixName) {
    firstCoursePrefixName.textContent = "Sorted classes";
  }

  // Remove the course-prefix-abbr-container and course-prefix-link elements
  var firstCoursePrefixAbbrContainer = coursePrefixContainers[0].querySelector(
    ".course-prefix-abbr-container"
  );
  var firstCoursePrefixLink = coursePrefixContainers[0].querySelector(
    ".course-prefix-link"
  );
  if (firstCoursePrefixAbbrContainer) {
    firstCoursePrefixAbbrContainer.remove();
  }
  if (firstCoursePrefixLink) {
    firstCoursePrefixLink.remove();
  }
}

function resetOrder() {
  location.reload();
}

//add button
// Create a button element
// Create the sort buttons
// Create a container for the sort buttons
var buttonContainer = document.createElement("div");

var sortUpButton = document.createElement("button");
var sortDownButton = document.createElement("button");

// Set the button properties
sortUpButton.textContent = "Sort by GPA (Low to High)";
sortDownButton.textContent = "Sort by GPA (High to Low)";

sortUpButton.classList.add("sortButton");
sortDownButton.classList.add("sortButton");

sortDownButton.style.marginRight = "15px";

// Add the sort buttons to the container
buttonContainer.appendChild(sortDownButton);
buttonContainer.appendChild(sortUpButton);

// Get the element after which to insert the sort buttons
var coursePrefixInfo = document.querySelector(".course-prefix-info");

if (coursePrefixInfo) {
  coursePrefixInfo.parentNode.insertBefore(buttonContainer, coursePrefixInfo);
}

var sortUpButtonIsOn = false;
var sortDownButtonIsOn = false;

sortUpButton.addEventListener("click", function () {
  sortUpButtonIsOn = !sortUpButtonIsOn;
  if (sortUpButtonIsOn) {
    sortDownButtonIsOn = false;
    sortUpButton.classList.add("toggledOn");
    sortDownButton.classList.remove("toggledOn");
    sortGPA(false);
  } else {
    sortUpButton.classList.remove("toggledOn");
    resetOrder();
  }
});

sortDownButton.addEventListener("click", function () {
  sortDownButtonIsOn = !sortDownButtonIsOn;
  if (sortDownButtonIsOn) {
    sortUpButtonIsOn = false;
    sortDownButton.classList.add("toggledOn");
    sortUpButton.classList.remove("toggledOn");
    sortGPA(true);
  } else {
    sortDownButton.classList.remove("toggledOn");
    resetOrder();
  }
});

/* This function displays the average GPA of a course. If the course is invalid or there is no grade data
on the course, this function will display N/A. It first uses PlanetTerps API to retrieve the grade data
of a specific course and then calculates the avergae GPA based off the data using UMD GPA grade scale.
It's important to note that this function inserts html and also modifies the css corresponding to the html. */
function addGPA() {
  let classes = document.getElementsByClassName("course-id");

  for (let x = 0; x < classes.length; x++) {
    fetch("https://api.planetterp.com/v1/course?name=" + classes[x].innerText)
      .then(function (res) {
        /* This returns a list of arrays, each array having the grades of a section */
        return res.json();
      })
      .then(function (body) {
        /* Adds hyperlink to course name */
        var className = classes[x].innerHTML;
        classes[x].innerHTML =
          "<a href=" +
          "https://planetterp.com/course/" +
          className +
          ">" +
          className +
          "</a>";

        /* There is grade data available for this course */
        if (body["average_gpa"]) {
          var averageGPA = body["average_gpa"];

          /* Rounds GPA to the nearest hundreth place */
          var roundedAvgGPA = Math.ceil(averageGPA * 100) / 100;

          var color = "";

          /* Determine the color of the circle based of the GPA */
          if (roundedAvgGPA >= 3.5) {
            /* Green for As*/
            color = "#2CE574";
          } else if (roundedAvgGPA >= 2.85 && roundedAvgGPA < 3.5) {
            /* Light Green for Bs */
            color = "#CDF03A";
          } else if (roundedAvgGPA >= 1.7 && roundedAvgGPA < 2.85) {
            /* Yellow For Cs */
            color = "#fff700";
          } else {
            /* Red for Fs/Ws/etc */
            color = "#FF3924";
          }

          classes[x].innerHTML =
            classes[x].innerHTML +
            '<br><br><div class="circle" id="courseColor' +
            courseIndex +
            '">GPA: ' +
            roundedAvgGPA +
            '</div><a href="https://planetterp.com/course/' +
            className +
            '" target="_blank" class="see-more-link" id="see-more-link">More Stats <img src="https://planetterp.com/static/images/logo.png" ;"></a>';
          document.getElementById(
            "courseColor" + courseIndex
          ).style.background = color;
          courseIndex++;

          /* No grade data for this course */
        } else {
          classes[x].innerHTML =
            classes[x].innerHTML +
            '<br> <br> GPA: N/A <a href="https://planetterp.com/course/' +
            className +
            '" target="_blank" class="see-more-link" id="see-more-link">More Stats <img src="https://planetterp.com/static/images/logo.png" ;"></a>';
        }
      })
      .catch(function (error) {
        console.log("Error: " + error);
        // Handle the error here, such as setting a default GPA value
        classes[x].innerHTML =
          classes[x].innerHTML +
          '<br> <br> GPA: N/A <a href="https://planetterp.com/course/' +
          '" target="_blank" class="see-more-link" id="see-more-link">More Stats <img src="https://planetterp.com/static/images/logo.png" ;"></a>';
      });
  }
}
