const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const axios = require("axios");
const btoa = require("btoa");
const fs = require("fs");
const uuidv4 = require("uuid").v4;

// all github actions
const { Octokit } = require("@octokit/rest");
const octokit = new Octokit({
  auth: process.env.PERSONAL_ACCESS_TOKEN,
});

// create a repository -- tested
const createRepository = async (project_name) => {
  return octokit.rest.repos.createInOrg({
    org: "coot-common-suite",
    name: project_name,
    auto_init: true,
    private: true,
  });
};

// get ref
const getRef = async (project_name, branch) => {
  let ref_response = await octokit.rest.git.getRef({
    owner: "coot-common-suite",
    repo: project_name,
    ref: `heads/${branch}`,
  });
  return ref_response.data.object.sha;
};

// get a tree
const getCommit = async (project_name, commit_sha) => {
  let commit_resp = await octokit.rest.git.getCommit({
    owner: "coot-common-suite",
    repo: project_name,
    commit_sha,
  });
  return commit_resp.data;
};

// create a blob

const createBlob = async (project_name, content) => {
  let blob_response = await octokit.rest.git.createBlob({
    owner: "coot-common-suite",
    repo: project_name,
    content,
    encoding: "base64",
  });
  return blob_response.data.sha;
};

// create a tree
const createTree = async (project_name, blobs, paths, base_tree) => {
  const tree = blobs.map((sha, index) => ({
    path: paths[index],
    mode: `100644`,
    type: `blob`,
    sha,
  }));
  const tree_response = await octokit.git.createTree({
    owner: "coot-common-suite",
    repo: project_name,
    tree,
    base_tree,
  });
  return tree_response.data.sha;
};

// create a commit
const createCommit = async (project_name, tree, latest_commit) => {
  let commit_resp = await octokit.rest.git.createCommit({
    owner: "coot-common-suite",
    repo: project_name,
    message: uuidv4(),
    tree,
    parents: [latest_commit],
  });
  return commit_resp.data.sha;
};

// push changes to branch
const pushChangesToBranch = async (project_name, branch, sha) => {
  return await octokit.git.updateRef({
    owner: "coot-common-suite",
    repo: project_name,
    ref: `heads/${branch}`,
    sha,
  });
};

// createRepository("test").then((_) => {
//   console.log(_);
// });

// getCommitsTree("test_02", "1591cda0854662f1174ffa2e1ee885988353951e")
//   .then((_) => {
//     console.log(_); //ad1eec81fc333bf8246911933e26339f38cca52a
//   })
//   .catch((er) => console.log(er));

// createBlob("test", Buffer.from(fs.readFileSync(__dirname + "/views/index.html"),"binary").toString("base64"))
//   .then(async (_) => {
//     let blobs = [_];
//     let paths = ["index.html"];
//     let last_commit = await getRef("test", "main");
//     let currentCommit = await getCommit("test", last_commit);
//     let currentTreeSHA = currentCommit.tree.sha;
//     let latest_commit = currentCommit.sha;
//     let newTreeSha = await createTree("test", blobs, paths, currentTreeSHA);
//     let newCommitSha = await createCommit("test", newTreeSha, latest_commit);
//     console.log(await pushChangesToBranch("test", "main", newCommitSha));
//   })
//   .catch((err) => console.log(err));

// retrieve specific file from repository
const getFiles = async (project_name, path, commit) => {
  let files_resp = await octokit.rest.repos.getContent({
    owner: "coot-common-suite",
    repo: project_name,
    path: path,
    ref: commit,
  });
  return Buffer.from(files_resp.data.content, "base64").toString("utf-8");
};

let startTime = Date.now();

// let str = `blog/1,500 new cases of RB detected in this year.html:blog/10 facts behind the darkness.html:blog/10 Myths about Eye Donation.html:blog/10 Things You Must Take in Your Diet to Keep Your Eyes Healthy.html:blog/10 Ways to Keep Your Eyes Healthy at Workplace.html:blog/5 CAREER OPTIONS THAT LASIK WOULD BENEFIT.html:blog/5 Facts You Should Know About Eye Cancer.html:blog/5 Simple Exercises to Prevent Computer Vision Syndrome.html:blog/5 Simple Exercises to Strengthen Weak Eye Muscles.html:blog/5 Simple Eye Exercises to Keep your Eyes Relaxed.html:blog/5 Things to remember when you wear Contact Lenses.html:blog/5 Things You Should Include In Your Daily Diet for Healthy Eyes in summers.html:blog/5 Tips To Keep Your Vision Sharp.html:blog/5 Warning Signs that shows Eyesight is declining.html:blog/5 Ways to Protect Your Eyes from Pollution.html:blog/5 Ways to take care of your Eyes this winter.html:blog/6 tips for a 6 6 Vision.html:blog/7 Things You re Doing at Your Desk That Will Give You Eye Strain.html:blog/7 Tips for Summer Eye Care.html:blog/7 Ways to Improve Your Eyesight While Driving.html:blog/9 Eye Makeup Safety Tips That You Must Follow Always.html:blog/An Eye for an Eye will eradicate blindness.html:blog/An Eye Tattoo Can Cost You Your Vision.html:blog/Are you eligible to donate eyes .html:blog/Awareness programmes on retinoblastoma.html:blog/Beat Convergence Insufficiency With These Easy Exercises.html:blog/Beauty is forever, Beauty Products are not Expiration Date on your Eye Products.html:blog/Benefits of Night Vision Glasses.html:blog/Best Eye Hospital in Hyderabad Book an Appointment Today.html:blog/Best Foods for Eye Health.html:blog/Blindness in India.html:blog/blog-archive.html:blog/Books or E Readers Which are better for your eyes .html:blog/Break Up Before It s Too Late Breaking up with various unhealthy lifestyle .html:blog/Cameras v s the Human Eye.html:blog/Can LASIK fix Astigmatism .html:blog/Can Steroids Cause any Eye Problem .html:blog/Can summer air affect your eyes .html:blog/Catch your breath Here s why you shouldn t choke on polluted air.html:blog/Choosing the right Sunglasses 2.html:blog/Choosing the right Sunglasses.html:blog/Common Eye allergies.html:blog/Common Symptoms of Eye allergies.html:blog/Computer Vision Syndrome.html:blog/CONTOURA VISION SPECS REMOVAL IS IT WORTH GOING FOR .html:blog/Decorative Lenses Can Cost You Your Vision.html:blog/Do You Enjoy Outdoor Sports Here are 5 Eye Care Tips for You .html:blog/Don t Let Your Eyes Reveal Your Age 2.html:blog/Don't Let Your Eyes Reveal Your Age.html:blog/Easy Exercises That Can Enliven Your Eyes.html:blog/ET NOW Indiamart Leaders Of tomorrow national award.html:blog/Even Great Vision Needs Eye Exam.html:blog/Everything You Should Know About Bifocals.html:blog/Exam Stress Five Exercises to Keep Your Eyes Relaxed During Preparations.html:blog/Exercise benefits your eyes.html:blog/Exercise you should start doing for Healthy Eyes .html:blog/Eye Allergies Symptoms in Monsoon.html:blog/Eye Banks In Delhi Donate Your Eyes To Light A Life.html:blog/Eye Care during Monsoons.html:blog/Eye Care Everywhere World Sight Day 2018.html:blog/Eye Care in Spring Season Don t let eye allergies spring an unpleasant surprise.html:blog/Eye Care in Summers-v2.html:blog/Eye Care in summers.html:blog/Eye Care Tips for Monsoon.html:blog/Eye Care Tips For Your Pets.html:blog/Eye Care Tips for Your Workplace.html:blog/Eye Disorders Symptoms and Treatment.html:blog/Eye Donation Facts and Myths.html:blog/Eye exercise while working on Laptop.html:blog/Eyeing summer with care.html:blog/Facts and FAQs about Eye Donation.html:blog/Financial Year Closing & Eye Stress Here Are Few Tips to Keep Your Eyes Healthy.html:blog/Find Out the Correlation between Headache and Eye Problems.html:blog/Five Myths about Eyes You Need To Stop Believing.html:blog/Five Problems Only People Wearing Contact Lenses Can Understand.html:blog/Five Problems Only People Wearing Glasses Can Understand.html:blog/Five Ways To Keep Your Eyes Safe This Diwali.html:blog/For Healthy Eye Don t Binge Watch & Chill.html:blog/Gender Vision Differences Men and Women don t see Eye To Eye.html:blog/Get Ready for Examinations.html:blog/Get Rid of Computer Eye Strain.html:blog/Get The Best Eye Care With The Top Ophthalmologists In Delhi.html:blog/Good Grades should not come at the cost of Deteriorated Vision.html:blog/Guidelines for Choosing the Right Pair of Sun Glasses.html:blog/Have a look at our guide of how your age is related to your eye diseases .html:blog/Have You Ever Thought What Happens To Your Eyes During Hypnosis .html:blog/Herbs For The Eyes.html:blog/Holi 2020 Your Guide To Complete Eye Care.html:blog/How Alcohol Affects Our Eyes.html:blog/How Blood Pressure is Related to Your Eyes .html:blog/How Eye Donation Works in India.html:blog/How Pregnancy Affects Vision .html:blog/How to find the Right Ophthalmologist Near Me.html:blog/How to improve hand eye coordination .html:blog/How to keep your eye s protected this winter .html:blog/How to keep your Eyes Healthy this Festive Season .html:blog/How to not lose vision to Diabetes.html:blog/How to protect your eyes from SMOG.html:blog/How to Take Care of Eyes Daily.html:blog/How Your Eyes Are At The Risk Of Coronavirus.html:blog/Hygiene for Healthy Eyes.html:blog/Importance of Eye Dilation during Eye Checkup.html:blog/Importance of Eye Donation.html:blog/index.html:blog/India has highest number of Retinoblastoma effected children CFS.html:blog/Is an online Eye Test being better or not .html:blog/Is your Baby s Eyesight Developing Normally .html:blog/Is Your Eye Makeup Affecting Your Vision .html:blog/Is Your Make Up Affecting Your Eyes .html:blog/Know About Lazy Eyes.html:blog/Know more about how 3D Movies are affecting your Eyes.html:blog/Light up a life.html:blog/Makeup Tips for Healthy Eyes.html:blog/Monsoon s Diet Plan for Healthy Vision.html:blog/Monsoons Are Here And So Are Eye Problems Here Are 7 Tips You Need To Follow This Monsoon For Healthy Eyes.html:blog/National Braille Literacy Month.html:blog/Natural Remedies to Save your Eyes from Pollution.html:blog/Nutrients that will optimize your eye health.html:blog/Nutrition for Healthy Eyesight.html:blog/Nutrition for Your Eyes.html:blog/Perfect Diwali Gift for Your Parents and Grand Parents.html:blog/Pollutants in Air How to Protect your Eyes from Harm.html:blog/Post Diwali Pollution Eye Care Tips.html:blog/Preparing Your Child s Eyes for Sunshine and Summertime.html:blog/Protect your eyes against home hazards.html:blog/Protecting your child s eyes and vision.html:blog/Running is not only advantageous for health of heart, it benefits Eyesight as well.html:blog/Save Your Sight By Acting At The Right Time .html:blog/Say No To Reading Glasses.html:blog/SEVEN differences you can bring in the life of a blind.html:blog/Seven Unhealthy Habits You Must Avoid To Keep Your Eyes Healthy.html:blog/Simple Eye Exercises to Relieve Computer Eye Strain & Stress.html:blog/Simple Guide to Natural Eye care.html:blog/Smoking and Its Impact on Eye Health.html:blog/Smoking is injurious to Eyes Quit Smoking .html:blog/Spring has sprung 5 Tips to prepare for Allergy Season.html:blog/Summer Eye Care.html:blog/Surprising Animal Vision Facts.html:blog/Tear Gas How Dangerous is it for your eyes .html:blog/The Season of Allergies is Back Tips to Reduce.html:blog/Things To Keep In Mind While Buying Prescription Glasses.html:blog/Things to keep in mind while looking for the best eye hospital in Delhi.html:blog/Things Women Must Know About Eye Care.html:blog/Things You Should Do To Protect Our Eyes During Holi.html:blog/This Christmas, Be Someone s Santa.html:blog/This Dusshera Pledge to bring Light in the lives of those in darkness.html:blog/Tips for Maintaining Good Eye Health.html:blog/Tips for Selecting Glasses or Contacts for Children.html:blog/Tips to protect your eyes during Swimming.html:blog/Tips to protect your eyes from Conjunctivitis.html:blog/Want to get rid of the Eye Discharge .html:blog/Want to improve your vision naturally, here s what you should know .html:blog/What a pellet does to the human eye .html:blog/What are the Symptoms and Causes of Macular Degeneration .html:blog/What causes Bloodshot Eyes and How to Treat Red Eyes .html:blog/What do your Eye Colours say about you .html:blog/What if your child receives a Corneal Abrasion .html:blog/What Is The Impact Of 3D Entertainment On Your Eyes .html:blog/What Really Happens When You Sleep In Your Contact Lenses .html:blog/What Technology brings to Future of Eye Care.html:blog/What To Do In Case Of An Eye Accident While Burning Crackers .html:blog/What to do When You Have an Eye Injury .html:blog/While you enjoy Dusshera, many sit in the dark Pledge to donate your eyes and Light a Life .html:blog/Why can LASIK be a better solution than contact lenses .html:blog/Why Do Animals Eye Glow In Dark .html:blog/Why do we cry .html:blog/Why Is Sleep Important For Your Eyes .html:blog/Winter Is Coming 7 Eye Care Tips for the winter.html:blog/Winter is Coming and so is the problem of Dry Eyes.html:blog/Women s Day Special Women s Eye Care.html:blog/World Retinoblastoma Awareness Week.html:blog/You must include these in your diet for perfect eyesight.html:blog/Your Guide To Take Care Of Your Eyes In Summers.html:blog/Your Summer Diet Chart for Healthy Vision.html`;

// let paths = str.split(":");
// for (let path in paths) {
//   getFiles(
//     "rc40",
//     "blog/1,500 new cases of RB detected in this year.html",
//     "95505f2787f76159e64dbf01bfeb1edbcf7c2aa2"
//   )
//     .then((_) => {
//       let endTime = Date.now();
//       console.log(
//         "File fetched",
//         "Time Taken to get the file: " + (endTime - startTime) / 1000 + "s"
//       );
//     })
//     .catch((err) => console.log(err));
// }

const getLargerBlobs = async (repo, file_sha) => {
  return await octokit.rest.git.getBlob({
    owner: "coot-common-suite",
    repo,
    file_sha,
  });
};

const getTree = async (project_name, sha) => {
  let tree = await octokit.rest.git.getTree({
    owner: "coot-common-suite",
    repo: project_name,
    tree_sha: sha,
  });
  return tree.data.tree;
};

const getBlobFile = async (project_name, commit_sha, path) => {
  let paths = path.split("/");
  let tree = null;
  const pathLoop = async (i, tree_sha) => {
    tree = await getTree("rc40", tree_sha);
    tree = tree.filter((blob) => blob.path === paths[i])[0];
    if (tree.type === "tree") return await pathLoop(i + 1, tree.sha);
    else return tree;
  };
  let blob = await pathLoop(0, commit_sha);
  let blob_content = await octokit.rest.git.getBlob({
    owner: "coot-common-suite",
    repo: project_name,
    file_sha: blob.sha,
  });
  return Buffer.from(blob_content.data.content, "base64").toString();
};

// getTree(
//   "rc40",
//   "1d36aebadb0eb3364a85980b47f313cd8c17b93f",
//   "blog/index.html"
// ).then((res) => {
//   // console.log(JSON.stringify(res.filter((blob) => blob.path === path)[0]));
//   console.log(JSON.stringify(res));
// });

getBlobFile(
  "rc40",
  "1d36aebadb0eb3364a85980b47f313cd8c17b93f",
  "blog/index.html"
).then((res) => {
  console.log(res);
});
