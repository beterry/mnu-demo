let food = [];
let drinks = [];

let lastKnownScrollPosition = 0;
let scrollEventTicking = false;

const iconIndex = {
    Drinks: 'images/icons/Drinks.svg',
    Apps: 'images/icons/Apps.svg',
    Desserts: 'images/icons/Desserts.svg',
    Entrees: 'images/icons/Entrees.svg',
    Burgers: 'images/icons/Burgers.svg',
    Sandwiches: 'images/icons/Sandwiches.svg',
    Salads: 'images/icons/Salads.svg',
    Flatbreads: 'images/icons/Flatbreads.svg',
    Specials: 'images/icons/Specials.svg',
}

//TODO: make this an editable value in Contentful
const categoryOrder = ['Drinks', 'Specials', 'Apps', 'Salads', 'Flatbreads', 'Sandwiches', 'Burgers', 'Entrees', 'Desserts'];

//this needs to match variable in the CSS
const categoryNavHeight = 100;

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

    foodSorted.sort((a, b) => categoryOrder.indexOf(a.name) - categoryOrder.indexOf(b.name));

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
        sectionHeading.classList.add('category-name');

        section.appendChild(sectionHeading);

        const list = document.createElement('ul');
        list.id = category.name;

        //loop through items in category
        category.items.forEach((item) => {
            const listItem = document.createElement('li');
            listItem.classList.add('food-item');

            const h3ItemName = document.createElement('h3');
            h3ItemName.innerText = item.name;
            h3ItemName.classList.add('item-name');
            listItem.appendChild(h3ItemName);

            if (item.ingredients){
                const pIngredients = document.createElement('p');
                pIngredients.innerText = compileIngredientsString(item.ingredients);
                pIngredients.classList.add('item-info');
                listItem.appendChild(pIngredients);
            }

            const pPrice = document.createElement('p');
            pPrice.innerText = '$' + item.price.toFixed(2);
            pPrice.classList.add('item-price');
            listItem.appendChild(pPrice);

            //loop through tags on item
            let ulTags = null;
            if (item.tags){
                ulTags = document.createElement('ul');
                ulTags.classList.add('tag-list')

                item.tags.forEach(tag => {
                    const liTag = document.createElement('li');
                    liTag.innerText = tag;
                    liTag.classList.add('item-tag');

                    ulTags.appendChild(liTag);
                })
            }
            if (ulTags){
                listItem.appendChild(ulTags);
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
    h2SectionHeading.classList.add('category-name');
    sectionDrinks.appendChild(h2SectionHeading);

    //category list
    const ulDrinkCategories = document.createElement('ul');

    drinks.forEach(category => {
        const liCategory = document.createElement('li');
        liCategory.classList.add('drink-category');

        //category heading
        const h3CategoryHeading = document.createElement('h3');
        h3CategoryHeading.innerText = category.name;
        h3CategoryHeading.classList.add('category-name');
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
    const ulMenuCategories = document.getElementById("category-list-train");

    //isolate the category names
    let categoryList = food.map(cat => cat.name);
    //add Drinks to the category list
    categoryList.push('Drinks');
    categoryList.sort((a, b) => categoryOrder.indexOf(a) - categoryOrder.indexOf(b));

    categoryList.forEach(category => {
        const li = document.createElement('li');

        const button = document.createElement('button');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleCategoryTapped(category)
        });
        button.id = `${category}-button`
        button.classList.add('category-button');

        const spanCategoryName = document.createElement('span');
        spanCategoryName.innerText = category;
        spanCategoryName.classList.add('category-link-name');

        const imgIcon = document.createElement('img');
        imgIcon.src = iconIndex[category];
        imgIcon.alt = category;
        imgIcon.classList.add('category-link-icon');

        button.appendChild(imgIcon);
        button.appendChild(spanCategoryName);

        li.appendChild(button);
        ulMenuCategories.appendChild(li);
    })
}

//builds and returns a list node
const buildDrinkListItem = (item) => {
    const liDrink = document.createElement('li');
    liDrink.classList.add('drink-item');

    //drink name
    const h4DrinkName = document.createElement('h4');
    h4DrinkName.innerText = item.name;
    h4DrinkName.classList.add('item-name');
    liDrink.appendChild(h4DrinkName);

    //drink details
    if (item.abv || item.maker || item.location){
        const pItemDetails = document.createElement('p');
        pItemDetails.innerText = compileDrinkDetailString(item);
        pItemDetails.classList.add('item-info');
        liDrink.appendChild(pItemDetails);
    }

    //drink description
    if (item.description){
        const pItemDescription = document.createElement('p');
        pItemDescription.innerText = item.description;
        pItemDescription.classList.add('item-info')
        liDrink.appendChild(pItemDescription);
    }

    //price
    const pPrice = document.createElement('p');
    pPrice.innerText = '$' + item.price.toFixed(2);
    pPrice.classList.add('item-price');
    liDrink.appendChild(pPrice);

    //drink oz
    if (item.ounces){
        const pOz = document.createElement('p');
        pOz.innerText = item.ounces + 'oz';
        pOz.classList.add('drink-oz')
        liDrink.appendChild(pOz);
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

const handleCategoryTapped = (category) => {
    setActiveCategory(category);
    scrollToCategory(category);
}

const setActiveCategory = (category) => {
    clearActiveCategory();

    //add active class to new category
    const newButton = document.getElementById(`${category}-button`);
    newButton.classList.add('active-category');

    //scroll the category rail to correct location
    const rail = document.getElementById('category-list-rail');
    rail.scrollTo({
        left: newButton.offsetLeft,
        behavior: 'smooth',
    }) 
}

const clearActiveCategory = () => {
    const oldButton = document.getElementsByClassName('active-category');

    if (oldButton.length){
        oldButton[0].classList.remove('active-category');
    }
}

const scrollToCategory = (category) => {
    const distanceFromTop = document.getElementById(category).offsetTop;
    //these values should match the dimensions set in CSS
    const sectionGap = window.innerWidth > 768 ? 24 : 8;
    const scrollToPosition = distanceFromTop - categoryNavHeight - sectionGap;

    //no event listeners while scrolling
    scrollEventTicking = true;

    window.scrollTo({
        top: scrollToPosition,
        behavior: 'smooth',
    })

    //TODO: this is kinda hacky
    //after scrolling, allow scrolling event listeners again
    setTimeout(() => {
        scrollEventTicking = false;
    }, 1000);

    console.log('Scrolling to: ' + scrollToPosition);
}

const checkForScrollOverCategory = (scrollPos) => {
    const sectionGap = window.innerWidth > 768 ? 24 : 8;

    const categoryIndex = food.map(category => category.name).sort((a,b) => {
        return document.getElementById(a).offsetTop - document.getElementById(b).offsetTop
    })

    const i = categoryIndex.findIndex(category => {
        const viewStart = Math.round(scrollPos + sectionGap + categoryNavHeight);
        const sectionTop = Math.round(document.getElementById(category).offsetTop);

        console.log("Viewport is at: " + viewStart);

        return sectionTop > viewStart
    });

    console.log('Setting category: ' + i)

    if (scrollPos === 0){
        clearActiveCategory();
    }else if (i > 0){
        setActiveCategory(categoryIndex[i - 1]);
    }else{
        setActiveCategory("Drinks");
    }
}

document.addEventListener('scroll', () => {
    lastKnownScrollPosition = window.scrollY;

    if (!scrollEventTicking) {
        setTimeout(() => {
            checkForScrollOverCategory(lastKnownScrollPosition);
            scrollEventTicking = false;
        }, 500)
    }

    scrollEventTicking = true;
})