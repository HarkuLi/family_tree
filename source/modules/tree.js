'use strict';

const Tree = require('treant-js');

function displayTree(){
    let config = {
        chart: {
            container: "#tree"
        },
        
        nodeStructure: {
            text: { name: "Parent node" },
            children: [
                {
                    text: { name: "First child" }
                },
                {
                    text: { name: "Second child" }
                }
            ]
        }
    };

    let FamilyTree = new Tree.Treant(config, function(){
        console.log(FamilyTree);
        console.log(arguments);
    }, $);
}

module.exports = {
    displayTree,
}



