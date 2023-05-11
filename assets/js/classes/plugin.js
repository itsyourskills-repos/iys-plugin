function addTosessionStorage(item) {
  // Get the existing list from local storage
  const existingList = JSON.parse(sessionStorage.getItem("items") || "[]");

  // Check if the item already exists in the list
  const isDuplicate = existingList.some(
    (existingItem) =>
      existingItem._id === item._id && existingItem._id === item._id
  );

  // If the item is not a duplicate, add it to the list
  if (!isDuplicate) {
    const newList = [...existingList, item];
    sessionStorage.setItem("items", JSON.stringify(newList));
  }
}
function getListFromsessionStorage() {
  if (sessionStorage.getItem("items")) {
    return JSON.parse(sessionStorage.getItem("items"));
  } else {
    return [];
  }
}
function clearsessionStorage() {
  sessionStorage.removeItem("items");
}
const removeItemsFromSessionStorageAfterIndex = (index) => {
  const list = getListFromsessionStorage();
  const newList = list.slice(0, index + 1); // Keep the elements up to and including the specified index
  saveListToSessionStorage(newList);
};

const saveListToSessionStorage = (list) => {
  sessionStorage.setItem("items", JSON.stringify(list));
};

class IysSearchPlugin {
  constructor(config) {
    this.config = config;
    this.options = {
      ApiKey: null,
      divID: null,
      searchIimit: 10,
      onSearchSkillClick: null,
      selectedSkilldiv: null,
    };
    this.selectedSkills = [];
    if (typeof config == "object") {
      this.options = {
        ...this.options,
        ...config,
      };
    }
    if (this.options.ApiKey && this.options.divID) {
      this.rapidAPIheaders = {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": this.options.ApiKey,
          "X-RapidAPI-Host": "iys-skill-api.p.rapidapi.com",
        },
      };
      this.selectedDiv = document.getElementById(this.options.divID);
      this.searchValue = "";
      this.searchResultsList = [];
    } else {
      console.error("ApiKey  divID not set correctly ");
    }
  }

  //initi fuctions
  init() {
    this.createSearchBox();
    this.setupCreateSearchTriggers();
    // this.createSkillSearchList([]);
    // this.SelectSkill();
    // this.funtional
  }
  createSearchBox() {
    const div = document.createElement("div");
    div.classList.add("input-group", "input-group-lg");
    const input = document.createElement("input");
    this.searchInputBox = input;
    input.id = "plugin-search-id";

    input.classList.add("form-control");

    input.setAttribute("aria-label", "Sizing example input");
    input.setAttribute("placeholder", "Search Skills");
    input.setAttribute("aria-describedby", "inputGroup-sizing-lg");
    input.type = "search";
    div.appendChild(input);
    this.selectedDiv.appendChild(div);
    const divDropDown = document.createElement("div");
    divDropDown.id = "dropdown-plugin-div";
    this.selectedDiv.appendChild(divDropDown);
  }
  setupCreateSearchTriggers() {
    const searchBoxElement = document.getElementById("plugin-search-id");
    searchBoxElement.addEventListener("input", (event) => {
      event.preventDefault();
      this.searchValue = searchBoxElement.value;
      this.searchAPI(this.searchValue);
    });
  }

  getSkillName(skillObject) {
    return skillObject.term;
  }
  skillClick(skillListId) {
    //add to selected skill to list
    // add json stringfly
    let arrayKey = JSON.stringify(this.searchResultsList[skillListId]);

    if (!this.selectedSkills.includes(arrayKey)) {
      this.selectedSkills.push(
        JSON.stringify(this.searchResultsList[skillListId])
      );
    }
    if (this.options.onSearchSkillClick) {
      this.options.onSearchSkillClick(this.searchResultsList[skillListId]);
    } else {
      console.info("You can use 'onSearchSkillClick' to capture the skill");
    }
    this.createSkillSearchList([]);
    if (this.options.selectedSkilldiv) {
      this.createSelectedSkillList();
    }
  }

  deleteSelectedSkill(skillListId) {
    this.selectedSkills.splice(skillListId, 1);
    this.createSelectedSkillList();
  }

  createSelectedSkillList() {
    const div = document.getElementById(this.options.selectedSkilldiv);
    div.innerHTML = "";

    const ul = document.createElement("ul");
    ul.classList.add("list-group");

    for (let i = 0; i < this.selectedSkills.length; i++) {
      let button = document.createElement("button");
      button.classList.add("btn-close");
      button.type = "button";
      button.setAttribute("aria-label", "Close");
      button.addEventListener("click", (event) => {
        this.deleteSelectedSkill(i);
      });

      let li = document.createElement("li");
      li.classList.add("list-group-item", "me-1");
      li.appendChild(button);

      let label = document.createElement("label");
      label.classList.add("form-check-label");
      label.textContent = this.getSkillName(JSON.parse(this.selectedSkills[i]));

      li.appendChild(label);
      ul.appendChild(li);
    }
    div.appendChild(ul);
  }

  createSkillSearchList(searchResultsList) {
    const div = document.getElementById("dropdown-plugin-div");
    this.searchResultsList = searchResultsList;
    if (searchResultsList.length > 0) {
      const ul = document.createElement("ul");
      ul.classList.add("dropdown-menu");

      // create the list item elements and append them to the unordered list
      for (let i = 0; i < searchResultsList.length; i++) {
        const li = document.createElement("li");

        li.addEventListener("click", (event) => {
          this.skillClick(i);
        });
        const a = document.createElement("a");
        a.classList.add("dropdown-item");
        a.href = "#";
        a.innerHTML = this.searchHighlight(
          this.searchValue,
          this.getSkillName(searchResultsList[i])
        );
        li.appendChild(a);
        ul.appendChild(li);
      }
      ul.style.display = "inline";
      ul.style.width = "100%";
      div.innerHTML = "";
      div.appendChild(ul);
    } else {
      div.innerHTML = "";
    }

    this.searchInputBox.classList.remove("loading");
    this.searchInputBox.type = "search";
  }

  searchHighlight(searched, text) {
    if (searched !== "") {
      let re = new RegExp(searched, "gi"); // add "i" flag for case-insensitivity
      let newText = text.replace(re, (match) => `<b>${match}</b>`);
      return newText;
    }
    return text;
  }

  searchAPI() {
    this.searchInputBox.classList.add("loading");
    this.searchInputBox.type = "text";
    if (this.searchValue.length > 1) {
      fetch(
        `https://iys-skill-api.p.rapidapi.com/ISOT/?q=${this.searchValue}&limit=${this.options.searchIimit}`,
        this.rapidAPIheaders
      )
        .then((response) => response.json())
        .then((response) => {
          console.log(response.matches);
          if (this.searchValue == response.query) {
            this.createSkillSearchList(response.matches);
          }
        })
        .catch((err) => console.error(err));
    } else {
      this.createSkillSearchList([]);
    }
  }
}

class IysFunctionalAreasPlugin extends IysSearchPlugin {
  constructor(config) {
    super(config);
    this.options.skillPlayground = document.getElementById(
      this.options.skillPlayground
    );
    this.fillStarImageUrl =
      "https://i.ibb.co/zxrDfTN/Screenshot-from-2023-04-29-09-48-17.png";
    this.emptyStarImageUrl =
      "https://i.ibb.co/XC1pj0h/Screenshot-from-2023-04-29-09-49-11.png";

    this.ratedSelectedSkills = [];
  }
  init() {
    this.createSearchBox();
    this.setupCreateSearchTriggers();
    this.createPlayground();
    this.createFunctionalAreaBox();
    this.functionalAreaAPI();
    this.createRateSelectedSkills(this.options.skillPlayground, []);
    // this.createSkillSelectBox();
  }
  createPlayground() {
    this.selectedASkillBox = document.createElement("div");
    this.selectedASkillBox.classList.add("selected-skill-div");
    this.selectedASkillBox.id = "selected-skill-div";
    this.options.skillPlayground.appendChild(this.selectedASkillBox);
  }
  skillClick(skillListId) {
    clearsessionStorage();
    console.log(this.ratedSelectedSkills);
    this.createSkillSelectBox(this.searchResultsList[skillListId]);
    this.createSkillSearchList([]);
  }

  createSelectedSkillList(htmlElement) {
    const div = document.getElementById(this.options.selectedSkilldiv);
    div.innerHTML = "";

    const ul = document.createElement("ul");
    ul.classList.add("list-group");

    for (let i = 0; i < this.ratedSelectedSkills.length; i++) {
      let button = document.createElement("button");
      button.classList.add("btn-close");
      button.type = "button";
      button.setAttribute("aria-label", "Close");
      button.addEventListener("click", (event) => {
        this.deleteSelectedSkill(i);
      });

      let li = document.createElement("li");
      li.classList.add("list-group-item", "me-1");
      li.appendChild(button);

      let label = document.createElement("label");
      label.classList.add("form-check-label");
      label.textContent = this.getSkillName(this.ratedSelectedSkills[i]);

      li.appendChild(label);
      ul.appendChild(li);
    }
    div.appendChild(ul);

    htmlElement.appendChild(div);
  }

  SkillChildrenAPI(skillFileId) {
    fetch(
      `https://iys-skill-api.p.rapidapi.com/ISOT/children/?id=${skillFileId}`,
      this.rapidAPIheaders
    )
      .then((response) => response.json())
      .then((response) => {
        console.log(response);

        this.createSkillSearchList(response);
      })
      .catch((err) => console.error(err));
  }

  createSkillButton(htmlElement, skillDetail, isFuncSkill) {
    var button = document.createElement("button");

    if (isFuncSkill) {
      button.textContent = "+ " + skillDetail.name;
    } else if (skillDetail.child_count > 0) {
      button.textContent = "+ " + skillDetail.name;
    } else {
      button.textContent = skillDetail.name;
    }

    // button.textContent = "+ " +skillDetail.name;
    button.addEventListener("click", (event) => {
      if (isFuncSkill) {
        clearsessionStorage();
      }
      addTosessionStorage(skillDetail);
      this.createSkillSelectBox(skillDetail);
    });

    button.setAttribute("type", "button");
    button.setAttribute("class", "btn btn-light");
    button.style.border = "solid 2px grey";
    button.style.marginLeft = "5px";
    button.style.marginTop = "5px";

    htmlElement.appendChild(button);
  }

  createSkillSearchButtonList(htmlElement, fuctionalAreasList, isFuncSkill) {
    htmlElement.innerHTML = "";
    if (fuctionalAreasList.length > 0) {
      for (let i = 0; i < fuctionalAreasList.length; i++) {
        this.createSkillButton(htmlElement, fuctionalAreasList[i], isFuncSkill);
      }
    }
  }

  createSelectSkillsChildBox(htmlElement, skillList) {
    const outerDiv = document.createElement("div");
    if (skillList.length > 0) {
      outerDiv.classList.add("card");
      const innerDiv = document.createElement("div");
      innerDiv.classList.add("card");
      const cardBody = document.createElement("div");
      cardBody.classList.add("card-body");
      // cardBody.textContent = "skill list";
      innerDiv.appendChild(cardBody);
      this.createSkillSearchButtonList(cardBody, skillList);

      outerDiv.appendChild(innerDiv);
    } else {
      outerDiv.innerHTML = "<h4><i>No Chlid are there</i></h4>";
    }
    htmlElement.appendChild(outerDiv);
  }

  createSkillPath(htmlElement, skillList) {
    const ol = document.createElement("ol");
    ol.setAttribute("class", "breadcrumb");

    skillList.forEach((skill, index) => {
      const li = document.createElement("li");
      li.setAttribute("class", "breadcrumb-item");
      if (index === skillList.length - 1) {
        li.setAttribute("class", "breadcrumb-item active");
        li.setAttribute("aria-current", "page");
        li.textContent = skill.name;
      } else {
        li.addEventListener("click", (event) => {
          removeItemsFromSessionStorageAfterIndex(index);
          this.createSkillSelectBox(skill);
        });

        const link = document.createElement("a");
        link.setAttribute("href", `#`);
        link.textContent = skill.name;
        li.appendChild(link);
      }

      ol.appendChild(li);
    });

    const nav = document.createElement("nav");
    nav.setAttribute("aria-label", "breadcrumb");
    nav.appendChild(ol);
    htmlElement.appendChild(nav);
  }

  createRatingStars(htmlElement, fillStarNumber) {
    htmlElement.innerHTML = "";
    const container = document.createElement("div");
    container.classList.add("rating");
    container.style.display = "inline-flex";

    for (let i = 1; i <= 4; i++) {
      const span = document.createElement("span");
      span.classList.add("star");
      span.setAttribute("data-value", i);

      const img = document.createElement("img");
      img.width = 40;
      img.height = 40;
      img.src =
        i <= fillStarNumber ? this.fillStarImageUrl : this.emptyStarImageUrl;

      span.appendChild(img);
      container.appendChild(span);
      span.style.cursor = "pointer";
      span.addEventListener("click", () => {
        this.createRatingStars(htmlElement, i);
        console.log(`You clicked on star ${i}`);
        htmlElement.setAttribute("data-value", i);
        // Add any other functionality for when a star is clicked here
      });
    }
    htmlElement.appendChild(container);
  }

  createSkillRateModal(htmlElement, skillDetail) {
    // create button element

    // create modal element
    const modal = document.createElement("div");
    modal.setAttribute("class", "modal fade");
    modal.setAttribute("id", "exampleModal");
    modal.setAttribute("tabindex", "-1");
    modal.setAttribute("aria-labelledby", "exampleModalLabel");
    modal.setAttribute("aria-hidden", "true");

    // create modal dialog element
    const modalDialog = document.createElement("div");
    modalDialog.setAttribute("class", "modal-dialog modal-dialog-centered");

    // create modal content element
    const modalContent = document.createElement("div");
    modalContent.setAttribute("class", "modal-content");

    // create modal header element
    const modalHeader = document.createElement("div");
    modalHeader.setAttribute("class", "modal-header");

    const modalTitle = document.createElement("h1");
    modalTitle.setAttribute("class", "modal-title fs-5");
    modalTitle.setAttribute("id", "exampleModalLabel");
    modalTitle.textContent = "Rate Skill '" + skillDetail.name + "'";

    const closeButton = document.createElement("button");
    closeButton.setAttribute("type", "button");
    closeButton.setAttribute("class", "btn-close");
    closeButton.setAttribute("data-bs-dismiss", "modal");
    closeButton.setAttribute("aria-label", "Close");

    modalHeader.appendChild(modalTitle);
    modalHeader.appendChild(closeButton);

    // create modal body element
    const modalBody = document.createElement("div");
    const innerDivModel = document.createElement("div");
    modalBody.setAttribute("class", "modal-body");
    this.createRatingStars(innerDivModel, 0);

    // create div element
    const divElement = document.createElement("div");
    divElement.classList.add("mb-3");

    // create label element
    const labelElement = document.createElement("label");
    labelElement.classList.add("form-label");
    labelElement.textContent = "Comment";
    labelElement.setAttribute("for", "exampleFormControlTextarea1");

    // create textarea element
    const textareaElement = document.createElement("textarea");
    textareaElement.classList.add("form-control");
    textareaElement.setAttribute("id", "exampleFormControlTextarea1");
    textareaElement.setAttribute("rows", "3");

    // append label and textarea to the div
    divElement.appendChild(labelElement);
    divElement.appendChild(textareaElement);

    modalBody.appendChild(innerDivModel);
    // append div to the body or any other parent element
    modalBody.appendChild(divElement);

    // create modal footer element
    const modalFooter = document.createElement("div");
    modalFooter.setAttribute("class", "modal-footer");

    const closeButton2 = document.createElement("button");
    closeButton2.setAttribute("type", "button");
    closeButton2.setAttribute("class", "btn btn-secondary");
    closeButton2.setAttribute("data-bs-dismiss", "modal");
    closeButton2.textContent = "Close";

    const saveButton = document.createElement("button");
    saveButton.setAttribute("type", "button");
    saveButton.setAttribute("class", "btn btn-primary");
    saveButton.textContent = "Save changes";
    saveButton.addEventListener("click", () => {
      let ert = {
        commentText: textareaElement.value,
        rate: innerDivModel.getAttribute("data-value"),
        skillDetail: skillDetail,
      };
      this.ratedSelectedSkills.push(ert);
      this.createRateSelectedSKill();
      //
      // this.createRateSelectedSkills(this.options.skillPlayground,this.ratedSelectedSkills);

      closeButton2.click();
    });

    modalFooter.appendChild(closeButton2);
    modalFooter.appendChild(saveButton);

    // append modal elements to each other
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);

    modalDialog.appendChild(modalContent);

    modal.appendChild(modalDialog);

    // append button and modal to document body
    // htmlElement.appendChild(button);
    htmlElement.appendChild(modal);
  }

  createRateSelectedSKill() {
    // create unordered list element
    const ul = document.createElement("ul");
    
    // add classes to the unordered list element
    ul.classList.add("list-group", "list-group-flush");
    
    console.log(this.ratedSelectedSkills)
    // loop through the array of list item texts and create a list item for each
    for (let i = 0; i < this.ratedSelectedSkills.length; i++) {
      const li = document.createElement("li");
      li.textContent = this.ratedSelectedSkills[i].skillDetail.name;
      const spanDiv = document.createElement("span");
      this.createRatingStars(spanDiv,4)
      li.appendChild(spanDiv)

      ul.appendChild(li);
    }

    // append the unordered list element to the document body
    this.selectedRateSkillDiv.appendChild(ul);
  }

  createRateSelectedSkills(htmlElement) {
    // console.lo)
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    const cardBodyDiv = document.createElement("div");
    cardBodyDiv.classList.add("card-body");

    this.selectedRateSkillDiv = cardBodyDiv;

    const cardTitle = document.createElement("h4");
    cardTitle.classList.add("card-title");
    cardTitle.textContent = "Rate Selected Skills";

    const cardText = document.createElement("p");
    cardText.classList.add("card-text");
    const hrElement = document.createElement("hr");

    cardBodyDiv.appendChild(cardTitle);
    cardBodyDiv.appendChild(hrElement);
    cardBodyDiv.appendChild(cardText);

    cardDiv.appendChild(cardBodyDiv);
    htmlElement.appendChild(cardDiv);
  }

  createSkillSelectBox(skillDetail) {
    this.selectedASkillBox.innerHTML = "";
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("card");

    const cardBodyDiv = document.createElement("div");
    cardBodyDiv.classList.add("card-body");

    const cardTitleH4 = document.createElement("h4");
    cardTitleH4.classList.add("card-title");

    const rateButton = document.createElement("button");
    rateButton.classList.add("btn", "btn-warning", "float-right");
    rateButton.setAttribute("type", "button");
    rateButton.setAttribute("data-bs-toggle", "modal");
    rateButton.setAttribute("data-bs-target", "#exampleModal");

    rateButton.textContent = "Rate";

    this.cardBodyDiv = cardBodyDiv;
    let titleText;

    if (skillDetail?.term) {
      titleText = document.createTextNode(
        "Selected Skills " + `"${skillDetail.term}"`
      );
      this.createSkillRateModal(cardDiv, skillDetail?.skills[0]);
    } else {
      this.createSkillRateModal(cardDiv, skillDetail);
      titleText = document.createTextNode(
        "Selected Skills " + `"${skillDetail.name}"`
      );
    }

    cardTitleH4.appendChild(titleText);

    if (skillDetail.rating_type > 0) {
      cardTitleH4.appendChild(rateButton);
    } else if (
      skillDetail?.skills?.length > 0 &&
      skillDetail?.skills[0].rating_type > 0
    ) {
      cardTitleH4.appendChild(rateButton);
    }

    const hrElement = document.createElement("hr");

    cardBodyDiv.appendChild(cardTitleH4);
    cardBodyDiv.appendChild(hrElement);
    this.createSkillPath(cardBodyDiv, getListFromsessionStorage());

    if (skillDetail?.skills?.length > 0) {
      skillDetail.skills.forEach((skill) => {
        clearsessionStorage();
        this.treeSkillAPI(cardBodyDiv, skill._id);
        // this.createSkillPath(cardBodyDiv, getListFromsessionStorage());
      });
    } else {
      this.childrenSkillAPI(skillDetail._id);
    }

    cardDiv.appendChild(cardBodyDiv);
    this.selectedASkillBox.appendChild(cardDiv);
  }

  createFunctionalAreaBox() {
    const div = document.createElement("div");

    // create a div element with class "card" and style attribute "width: 18rem;"
    const card = document.createElement("div");
    card.classList.add("card");

    // create a div element with class "card-body" and append it to the card element
    let cardBody = document.createElement("div");
    cardBody.classList.add("card-body");

    this.funcSkillCard = document.createElement("div");
    // create a h5 element with class "card-title", set its text content to "Card title", and append it to the card-body element
    const cardTitle = document.createElement("h4");
    const hr = document.createElement("hr");
    cardTitle.classList.add("card-title");
    cardTitle.textContent = "Functional Areas";
    cardTitle.appendChild(hr);
    cardBody.appendChild(cardTitle);
    cardBody.appendChild(this.funcSkillCard);
    card.appendChild(cardBody);

    // append the card element to the document body
    div.appendChild(card);
    // console.log(this.options)
    this.options.skillPlayground.appendChild(div);
  }

  functionalAreaAPI() {
    fetch(
      "https://iys-skill-api.p.rapidapi.com/ISOT/popular-categories/",
      this.rapidAPIheaders
    )
      .then((response) => response.json())
      .then((response) => {
        console.log(response);

        this.createSkillSearchButtonList(this.funcSkillCard, response, true);
      })
      .catch((err) => console.error(err));
  }

  childrenSkillAPI(skillId) {
    fetch(
      "https://iys-skill-api.p.rapidapi.com/ISOT/children/?id=" + skillId,
      this.rapidAPIheaders
    )
      .then((response) => response.json())
      .then((response) => {
        console.log("children", response);
        this.createSelectSkillsChildBox(this.cardBodyDiv, response);
      })
      .catch((err) => console.error(err));
  }
  treeSkillAPI(cardBodyDiv, skillId) {
    fetch(
      "https://iys-skill-api.p.rapidapi.com/ISOT/tree/?id=" + skillId,
      this.rapidAPIheaders
    )
      .then((response) => response.json())
      .then((response) => {
        this.createSkillPath(cardBodyDiv, response.ancestors);
        if (response.siblings.length > 0) {
          this.createSelectSkillsChildBox(this.cardBodyDiv, response.siblings);
        } else {
          this.childrenSkillAPI(skillId);
        }
      })
      .catch((err) => console.error(err));
  }
}

//   constructor(config) {
//     this.config = config;
//     this.options = {
//       ApiKey: null,
//       divID: null,
//       onSearchSkillClick: null,
//     };
//     if (typeof config == "object") {
//       this.options = {
//         ...this.options,
//         ...config,
//       };
//     }
//     if (this.options.ApiKey && this.options.divID) {
//       this.rapidAPIheaders = {
//         method: "GET",
//         headers: {
//           "X-RapidAPI-Key": this.options.ApiKey,
//           "X-RapidAPI-Host": "iys-skill-api.p.rapidapi.com",
//         },
//       };
//       this.selectedDiv = document.getElementById(this.options.divID);
//       this.currentSkill = null;
//       this.init();
//     } else {
//       console.error("ApiKey  divID not set correctly ");
//     }
//   }

//   init() {
//     this.createFunctionalAreaBox();
//     this.functionalAreaAPI();
//     // this.setupCreateSearchTriggers()
//   }
