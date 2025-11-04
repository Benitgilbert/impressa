import fs from "fs";
import handlebars from "handlebars";

export const renderTemplate = (templateName, data) => {
  const source = fs.readFileSync(`templates/${templateName}.html`, "utf8");
  const template = handlebars.compile(source);
  return template(data);
};