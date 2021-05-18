let food = [];
let drinks = [];

const client = contentful.createClient({
    space: '3t2epby3nzvk',
    accessToken: 'U6A7spSwhw5u4PPhyxE3PkX4uKkHqhp2DR2JZWRS_j4',
})

//food items
const foodCall = client.getEntries({'content_type': 'item'});

//drinks items
const drinkCall = client.getEntries({'content_type': 'drinkItem'});

Promise.all([foodCall, drinkCall])
.then((res) => {
    //food
    food = organizeFood(res[0]);
    console.log(food);
    buildFoodMenu();

    //drinks
    drinks = organizeDrinks(res[1]);
    console.log(drinks);
    buildDrinkMenu();

    buildCategoryLinks();
})

//seperates food items from Contentful into categories
const organizeFood = (data) => {
    const foodUnsorted = data.items.map((item) => item.fields);
    let foodSorted = [];

    foodUnsorted.forEach(item => {
        const i = foodSorted.findIndex(category => category.name === item.category);
        if (i >= 0){
            foodSorted[i].items.push(item);
        }else{
            foodSorted.push({
                name: item.category,
                items: [item],
            });
        }
    })

    return foodSorted;
}

//seperates drink items from Contentful into categories
const organizeDrinks = (data) => {
    const drinksUnsorted = data.items.map((item) => item.fields);
    let drinksSorted = [];

    drinksUnsorted.forEach(item => {
        const i = drinksSorted.findIndex(category => category.name === item.drinkCategory);
        if (i >= 0){
            drinksSorted[i].items.push(item);
        }else{
            drinksSorted.push({
                name: item.drinkCategory,
                items: [item],
            });
        }
    })

    return drinksSorted;
}

const buildFoodMenu = () => {
    food.forEach(category => {
        const container = document.getElementById('menu')

        const section = document.createElement('section');
        section.id = category.name;
        
        const sectionHeading = document.createElement('h2');
        sectionHeading.innerText = category.name;

        section.appendChild(sectionHeading);

        const list = document.createElement('ul');
        list.id = category.name;

        //loop through items in category
        category.items.forEach((item) => {
            const listItem = document.createElement('li');

            const heading = document.createElement('h3');
            heading.innerText = item.name;

            const ingredients = document.createElement('p');
            ingredients.innerText = compileIngredientsString(item.ingredients);

            const price = document.createElement('p');
            price.innerText = '$' + item.price;

            //loop through tags on item
            let tagList = null;
            if (item.tags){
                tagList = document.createElement('ul');

                item.tags.forEach(tag => {
                    const tagListItem = document.createElement('li');
                    tagListItem.innerText = tag;

                    tagList.appendChild(tagListItem);
                })
            }
            
            //append info to menu item
            listItem.appendChild(heading);
            listItem.appendChild(ingredients);
            listItem.appendChild(price);
            if (tagList){
                listItem.appendChild(tagList);
            }

            //append menu item to list
            list.appendChild(listItem);
        })

        section.appendChild(list);
        container.appendChild(section);
    })
}

const buildDrinkMenu = () => {
    const mainContainer = document.getElementById('menu')

    const sectionDrinks = document.createElement('section');
    sectionDrinks.id = 'Drinks';
    
    const h2SectionHeading = document.createElement('h2');
    h2SectionHeading.innerText = 'Drinks';
    sectionDrinks.appendChild(h2SectionHeading);

    //category list
    const ulDrinkCategories = document.createElement('ul');

    drinks.forEach(category => {
        const liCategory = document.createElement('li');

        //category heading
        const h3CategoryHeading = document.createElement('h3');
        h3CategoryHeading.innerText = category.name;
        liCategory.appendChild(h3CategoryHeading);

        //drink list
        const ulDrinks = document.createElement('ul');

        category.items.forEach(item => {
            const liDrink = buildDrinkListItem(item);
            ulDrinks.appendChild(liDrink);
        })

        //add drink list to category
        liCategory.appendChild(ulDrinks);

        //add category to list
        ulDrinkCategories.appendChild(liCategory);
    })

    sectionDrinks.appendChild(ulDrinkCategories);
    mainContainer.prepend(sectionDrinks);
}

const buildCategoryLinks = () => {
    const ulMenuCategories = document.getElementById("category-list");

    food.forEach(category => {
        const li = document.createElement('li');

        const link = document.createElement('a');
        link.innerText = category.name;
        link.href = '#' + category.name;

        li.appendChild(link);
        ulMenuCategories.appendChild(li);
    })
}

//builds and returnsa list node
const buildDrinkListItem = (item) => {
    const liDrink = document.createElement('li');

    //drink name
    const h4DrinkName = document.createElement('h4');
    h4DrinkName.innerText = item.name;
    liDrink.appendChild(h4DrinkName);

    //drink details
    if (item.abv || item.maker || item.location){
        const pItemDetails = document.createElement('p');
        pItemDetails.innerText = compileDrinkDetailString(item);
        liDrink.appendChild(pItemDetails);
    }

    //drink description
    if (item.description){
        const pItemDescription = document.createElement('p');
        pItemDescription.innerText = item.description;
        liDrink.appendChild(pItemDescription);
    }

    return liDrink;
}

const compileIngredientsString = (ingredients) => {
    //compile ingredients string
    let ingredientString = ""
    
    if(ingredients){
        ingredientString = ingredients[0]
        for (let i = 1; i < ingredients.length; i++){
            ingredientString += `, ${ingredients[i]}`
        }

        return ingredientString;
    }else{
        return null;
    }

}

const compileDrinkDetailString = (item) => {
    let drinkDetails = [];

    if (item.abv){
        drinkDetails.push(`${item.abv}% ABV`);
    }

    if (item.maker){
        drinkDetails.push(item.maker);
    }

    if (item.location){
        drinkDetails.push(item.location);
    }

    if (drinkDetails.length){
        return drinkDetails.join(' | ');
    }else{
        return '';
    }
}