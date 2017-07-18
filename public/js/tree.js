
function displayTree(data){
    let config = {
        chart: { 
            container: "#tree",
            connectors: {type: "step"},
        },
        nodeStructure: {
            text: { name: "Parent node" },
            children: data
        }
    };

    let FamilyTree = new Treant(config, () => {
        console.log(arguments);
    }, $);
}


displayTree(data);