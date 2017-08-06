/** complexity: 
 * worst: O(N^2)
 * average: O(n*N)
 * where n is average number of nodes in every generations, and N is the number of nodes
 */

/** declaration */
//convert string XXXpx to number XXX
var pxStrToNum = (pxStr)=>{
  return Number(pxStr.substr(0, pxStr.length-2));
}
//
//space between tree and container
const container_space = 40;
const border_width = 3;
const path_container = document.getElementsByClassName("path_container")[0];
const node_container = document.getElementsByClassName("node_container")[0];
const tree_row_list = document.getElementsByClassName("tree_row");
const tree_node_style = window.getComputedStyle(document.getElementsByClassName("tree_node")[0]);
//elements of boundary class
const boundary_eles = document.getElementsByClassName("boundary");
const boundary_style = boundary_eles.length ? window.getComputedStyle(boundary_eles[0]) : null;
var container_width/* = pxStrToNum(window.getComputedStyle(path_container, null).getPropertyValue("width"))*/;
const node_width = pxStrToNum(tree_node_style.getPropertyValue("width"));
//assume that height of every node are constant
const node_height = pxStrToNum(tree_node_style.getPropertyValue("height"));
//margin_bottom of a row
const row_mb = pxStrToNum(window.getComputedStyle(tree_row_list[0], null).getPropertyValue("margin-bottom"));
//regular margin-right
const reg_mr = pxStrToNum(tree_node_style.getPropertyValue("margin-right"));
//boundary margin-right
const bound_mr = boundary_style ? pxStrToNum(boundary_style.getPropertyValue("margin-right")) : 0;
var zoom = 100;
//used for record boundary 
var bound_record = [];
/** 
 * generate bound_record
 * complexity: Θ(N), where N is number of nodes
 */
for(let i=0; i<tree_row_list.length; ++i){
  let one_row_num = tree_row_list[i].children.length;
  let one_row_list = tree_row_list[i].children;
  bound_record[i] = [];
  for(let j=0; j<one_row_num; ++j){
    if(one_row_list[j].className.includes("boundary"))  bound_record[i].push(1);
    else  bound_record[i].push(0);
  }
}
/** generate bound_record */

var parent_x;
var parent_y;
var child_x;
var child_y;

/** input is a row of bound_record */
var rowWidth = (one_row_record)=>{
  var rst = node_width * one_row_record.length;
  for(let ele of one_row_record)
    rst += ele ? bound_mr : reg_mr;
  return rst;
};

var getObjList = new Promise((resolve, reject)=>{
  $.post("/tree/OA", (data, status)=>{
    if(status !== "success")  return reject("post status: "+status);
    resolve(data);
  });
});

/**
 * complexity:
 * worst: O(N^2)
 * average: O(n*N)
 * where n is average number of nodes in every generations, and N is the number of nodes
 * ****************************
 * return value: relation_list
 * the value is the order in generation of parent of a person
 * when the person is root, the value would be -1
 * when the person is relation by marriage, the value would be -2
 * ex: relation_list[3][2] = 3
 *     means that the parent of (2+1)rd person in (3+1)th generation is (3+1)th person in (2+1)rd generation
 */
var genParentList = (obj_list)=>{
  var relation_list = [];
  var row_idx = 0;

  for(let i=0; i<obj_list.length; ++i){
    let gen_num = obj_list[i];
    let last_parent = "";
    let last_parent_order = -1;  //parent order is the order of parent in his/her generation row
    relation_list[row_idx] = [];
    for(let j=0; j<gen_num; ++j){
      ++i;
      if(!obj_list[i].parents){
        if(i===1) relation_list[row_idx].push(-1);  //root
        else relation_list[row_idx].push(-2); //relation by marriage
      }
      else{
        if(obj_list[i].parents[0] === last_parent)
          relation_list[row_idx].push(last_parent_order);
        else{
          //find parent order
          let idx = i;
          //complexity: O(N), worst case occurs when one generation inculde the majority of member in the family
          //parent order isn't neccessarily the order of last parent plus 1
          let order = last_parent_order+1;
          for(let j=0; j<2; ++j){
            for(--idx; typeof(obj_list[idx])!=="number"; --idx){;}
          }
          ++idx;
          idx += last_parent_order+1;
          //find from the parent of last sibling
          for(; typeof(obj_list[idx])!=="number"; ++idx){
            if(obj_list[idx]._id === obj_list[i].parents[0]){
              last_parent = obj_list[i].parents[0];
              last_parent_order = order;
              relation_list[row_idx].push(order);
              break;
            }
            ++order;
          }
        }
      }
    }
    ++row_idx;
  }
  return relation_list;
}

var node_distance = (row, node1, node2)=>{
  var rst = (node2-node1) * node_width;
  for(let i=node1; i<node2; ++i)
    rst += bound_record[row][i] ? bound_mr : reg_mr;
  return rst
};

var get_row_height = (row)=>{
  return pxStrToNum(window.getComputedStyle(tree_row_list[row]).getPropertyValue("height"));
};
/** declaration */

////////////////////
//ready
////////////////////

$(()=>{

/** events */
$(window).resize(() => {
  $(".tree_frame").width(window.innerWidth * 0.95);
  $(".tree_frame").height(window.innerHeight * 0.83);
});

$("#zoom_out").on("click", () => {
  if(zoom <= 50) return;
  zoom -= 10;
  $(".node_container").css("zoom", zoom+"%")
});

$("#zoom_default").on("click", () => {
  zoom = 100;
  $(".node_container").css("zoom", "")
});

$("#zoom_in").on("click", () => {
  if(zoom >= 200) return;
  zoom += 10;
  $(".node_container").css("zoom", zoom+"%")
});

$(".tree_frame").width(window.innerWidth * 0.95);
$(".tree_frame").height(window.innerHeight * 0.83);
/** events */

/** 
 * change container size dynamically
 * complexity: Θ(N), where N is number of nodes
 */
var width = 0;
for(let i=0; i<bound_record.length; ++i){
  let row_width = rowWidth(bound_record[i]);
  width = (row_width > width) ? row_width : width;
}
width += container_space;
container_width = width;
var height = bound_record.length * row_mb;
for(let i=0; i<tree_row_list.length; ++i)
  height += get_row_height(i);
path_container.style.width = width + "px";
path_container.style.height = height + "px";
node_container.style.width = width + "px";
node_container.style.height = height + "px";
/** change container size dynamically */

getObjList
  .then((obj_list)=>{
    if(!obj_list.length)  return;
    var relation_list = genParentList(obj_list);
    var row_height, last_row_height;
    /** initialization */
    row_height = get_row_height(0);
    parent_x = (container_width - reg_mr) / 2;
    parent_y = relation_list[0].length===1 ? row_height : row_height/2;
    if(relation_list.length > 1){
      child_x = (container_width - rowWidth(bound_record[1]) + node_width) / 2;
      child_y = row_height + row_mb;
    }
    /** initialization */

    /**
     * draw path
     * complexity: O(N), where N is number of nodes
     */
    if(relation_list[0].length > 1){
      let element = document.createElementNS("http://www.w3.org/2000/svg", "path"); //because svg uses namespace
      let d = "M" + (parent_x-reg_mr/2) + "," + parent_y;
      d += "L" + (parent_x+reg_mr/2) + "," + parent_y;
      element.setAttribute("class", "path_prop");
      element.setAttribute("d", d);
      path_container.appendChild(element);
    }

    for(let i=1; i<relation_list.length; ++i){
      let one_row_num = relation_list[i].length;
      last_row_height = row_height;
      row_height = get_row_height(i);

      for(let j=0; j<one_row_num; ++j){
        //create a path
        if(relation_list[i][j] >= 0){
          //parent to child path
          let element = document.createElementNS("http://www.w3.org/2000/svg", "path"); //because svg uses namespace
          let d = "M" + parent_x + "," + parent_y;
          if(parent_y < child_y-row_mb)
            d += "L" + parent_x + "," + (parent_y+last_row_height/2+2);
          // d += "L" + parent_x + "," + (child_y - row_mb/2);
          // d += "L" + child_x + "," + (child_y - row_mb/2);
          d += "L" + child_x + "," + child_y;
          element.setAttribute("class", "path_prop");
          element.setAttribute("d", d);
          path_container.appendChild(element);
        }
        else if(relation_list[i][j] == -2){
          //mate path
          let element = document.createElementNS("http://www.w3.org/2000/svg", "path"); //because svg uses namespace
          let d = "M" + (child_x-node_width/2) + "," + (child_y+row_height/2);
          d += "L" + (child_x-node_width/2-reg_mr) + "," + (child_y+row_height/2);
          element.setAttribute("class", "path_prop");
          element.setAttribute("d", d);
          path_container.appendChild(element);
        }
        //create a path
        //compute position of next parent and child
        if(j<one_row_num-2 || (j===one_row_num-2&&relation_list[i][j+1]!==-2)){
          //2nd condition => boundary condition => last two node in the row: [mate],[common node]
          //compute the position of next parent
          let current_parent = relation_list[i][j]===-2 ? relation_list[i][j-1] : relation_list[i][j];
          let next_parent = relation_list[i][j+1]===-2 ? relation_list[i][j] : relation_list[i][j+1];
          if(next_parent !== current_parent){
            let pd = node_distance(i-1, current_parent, next_parent);
            if(relation_list[i-1][current_parent+1] && relation_list[i-1][current_parent+1]===-2){
              //current parent has a mate
              parent_x -= (reg_mr+node_width) / 2;
            }
            parent_x += pd;
            if(relation_list[i-1][next_parent+1] && relation_list[i-1][next_parent+1]===-2){
              //next parent has mate
              parent_x += (node_width+reg_mr) / 2;
              parent_y = child_y - row_mb - last_row_height/2;
            }
            else parent_y = child_y - row_mb;
          }
        }
        child_x += node_width;
        child_x += bound_record[i][j] ? bound_mr : reg_mr;
        //compute position of next parent and child
      }

      //compute initial position of parent and child for next row
      if(i < relation_list.length-1){
        let next_parent = relation_list[i+1][0];
        let pd = node_distance(i, 0, next_parent);
        child_x = (container_width - rowWidth(bound_record[i+1]) + node_width) / 2;
        child_y += row_height + row_mb;
        parent_y = child_y - row_mb;
        parent_x = (container_width - rowWidth(bound_record[i]) + node_width) / 2;
        parent_x += pd;
        if(relation_list[i][next_parent+1] && relation_list[i][next_parent+1]===-2){
          //the parent has a mate
          parent_x += (node_width+reg_mr) / 2;
          parent_y -= row_height / 2;
        }
      }
    }
    /** draw path */
  });
});