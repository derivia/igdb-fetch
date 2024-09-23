import { readFile, writeFile, readFileSync, appendFile } from "node:fs";

("use strict");

if (process.argv[2] == undefined) {
  console.log("You need to pass some arguments [oauth | games]");
  console.log("1. `oauth` to get secret key and id");
  console.log("2. `games` to get a list of games");
  process.exit();
}

function get_random_int(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

let quant;
const [client_id, client_secret, access_token] = readFileSync(
  "./secret",
  "utf8",
)
  .trim()
  .split("\n")
  .map((line) => line.trim());

const arg = process.argv[2];

if (process.argv[3] != undefined) {
  quant = process.argv[3];
} else {
  quant = 10;
}

if (arg == "oauth") {
  (async () => {
    const response = await fetch(
      `https://id.twitch.tv/oauth2/token?client_id=${client_id}&client_secret=${client_secret}&grant_type=client_credentials`,
      {
        method: "POST",
      },
    );
    const data = await response.json();
    const { access_token } = data;
    readFile("./secret", "utf8", (err, data) => {
      if (err) throw err;
      const lines = data.trim().split("\n");
      lines.splice(2, 1);
      lines.push(access_token);
      writeFile("./secret", lines.join("\n"), (err) => {
        if (err) throw err;
      });
    });
  })();
}

if (arg == "games") {
  (async () => {
    const url = "https://api.igdb.com/v4/games";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Client-ID": `${client_id}`,
        Authorization: `Bearer ${access_token}`,
        "Content-Type": "application/json",
      },
      body: `fields *;
      where rating >= 75;
      offset ${get_random_int(0, 2500)};
      limit ${quant};`,
    });

    const data = await response.json();
    const filteredData = data
      .map((item) => {
        const { name, url, first_release_date } = item;
        const date = new Date(first_release_date * 1000).toLocaleDateString(
          "pt-BR",
        );
        return `- ${name} [${url}] [${date}]`;
      })
      .join("\n");

    appendFile("jogos.md", `${filteredData}\n`, (err) => {
      if (err) throw err;
    });
  })();
}
