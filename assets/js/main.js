function selectedSkill(params) {
  console.log("api", params);
}

const plugin = new IysFunctionalAreasPlugin({
  ApiKey: "<API KEY>",
  divID: "serachid",
  onSearchSkillClick: selectedSkill,
  selectedSkilldiv: "selectSkill",
  skillPlayground: "skillPlayground",
});
plugin.init();
