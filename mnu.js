let food = [];
let drinks = [];

let lastKnownScrollPosition = 0;
let scrollEventTicking = false;

//this is the default shown
let activeMenu = 'food';

const iconIndex = {
    Starters: 'images/icons/icons_starters.svg',
    Desserts: 'images/icons/icons_dessert.svg',
    Entrees: 'images/icons/icons_entrees.svg',
    Burgers: 'images/icons/icons_burgers.svg',
    Sandwiches: 'images/icons/icons_sandwiches.svg',
    Salads: 'images/icons/icons_salads.svg',
    Flatbreads: 'images/icons/icons_flatbread.svg',
    Specials: 'images/icons/icons_specials.svg',
    Drafts: 'images/icons/icons_draft.svg',
    Bottles: 'images/icons/icons_bottles.svg',
    "Red Wine": 'images/icons/icons_red-wine.svg',
    "White Wine": 'images/icons/icons_white-wine.svg',
}

//TODO: make this an editable value in Contentful
const categoryOrder = [
    'Specials',
    'Starters',
    'Salads',
    'Flatbreads',
    'Sandwiches',
    'Burgers',
    'Entrees',
    'Desserts',
    'Drafts',
    'Bottles',
    'Red Wine',
    'White Wine',
];

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
    food = organizeItems(res[0]);
    console.log(food);
    buildMenu(food, 'food-menu');

    //drinks
    drinks = organizeItems(res[1]);
    console.log(drinks);
    buildMenu(drinks, 'drink-menu');

    buildCategoryLinks(food);
})

//seperates food items from Contentful into categories
const organizeItems = (data) => {
    const itemsUnsorted = data.items.map((item) => item.fields);
    let itemsSorted = [];

    itemsUnsorted.forEach(item => {
        const i = itemsSorted.findIndex(category => category.name === item.category);
        if (i >= 0){
            itemsSorted[i].items.push(item);
        }else{
            itemsSorted.push({
                name: item.category,
                items: [item],
            });
        }
    })

    itemsSorted.sort((a, b) => categoryOrder.indexOf(a.name) - categoryOrder.indexOf(b.name));

    return itemsSorted;
}

const buildMenu = (items, htmlID) => {
    items.forEach(category => {
        const container = document.getElementById(htmlID);

        const section = document.createElement('section');
        section.id = category.name;
        section.classList.add('menu-section');
        
        const sectionHeading = document.createElement('h2');
        sectionHeading.innerText = category.name;
        sectionHeading.classList.add('category-name');

        section.appendChild(sectionHeading);

        const list = document.createElement('ul');
        list.id = category.name;

        //loop through items in category
        category.items.forEach((item) => {
            const listItem = buildItem(item);

            //append menu item to list
            list.appendChild(listItem);
        })

        section.appendChild(list);
        container.appendChild(section);
    })
}

const buildCategoryLinks = (categories) => {
    //clear the train
    const ulMenuCategories = document.getElementById("category-list-train");
    ulMenuCategories.innerHTML = "";

    //isolate the category names
    let categoryList = categories.map(cat => cat.name);
    //add Drinks to the category list
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
const buildItem = (item) => {
    const liItem = document.createElement('li');
    liItem.classList.add('item');

    //drink name
    const h4ItemName = document.createElement('h4');
    h4ItemName.innerText = item.name;
    h4ItemName.classList.add('item-name');
    liItem.appendChild(h4ItemName);

    //drink details
    if (item.abv || item.maker || item.location){
        const pItemDetails = document.createElement('p');
        pItemDetails.innerText = compileDrinkDetailString(item);
        pItemDetails.classList.add('item-info');
        liItem.appendChild(pItemDetails);
    }

    //drink description
    if (item.description){
        const pItemDescription = document.createElement('p');
        pItemDescription.innerText = item.description;
        pItemDescription.classList.add('item-info')
        liItem.appendChild(pItemDescription);
    }

    //ingredients
    if (item.ingredients){
        const pItemIngredients = document.createElement('p');
        pItemIngredients.innerText = compileIngredientsString(item.ingredients);
        liItem.appendChild(pItemIngredients);
    }

    //price
    const pPrice = document.createElement('p');
    pPrice.innerText = '$' + item.price.toFixed(2);
    pPrice.classList.add('item-price');
    liItem.appendChild(pPrice);

    //drink oz
    if (item.ounces){
        const pOz = document.createElement('p');
        pOz.innerText = item.ounces + 'oz';
        pOz.classList.add('drink-oz')
        liItem.appendChild(pOz);
    }

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
        liItem.appendChild(ulTags);
    }

    return liItem;
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

    if (newButton){
        newButton.classList.add('active-category');
    
        //scroll the category rail to correct location
        const rail = document.getElementById('category-list-rail');
        rail.scrollTo({
            left: newButton.offsetLeft,
            behavior: 'smooth',
        }) 
    }else{
        clearActiveCategory();
    }
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

    const i = categoryOrder.findIndex(category => {
        const viewStart = Math.round(scrollPos + sectionGap + categoryNavHeight);
        const sectionTop = Math.round(document.getElementById(category).offsetTop);

        return sectionTop > viewStart
    });

    if (scrollPos === 0){
        clearActiveCategory();
    }
    
    if (i > 0){
        setActiveCategory(categoryOrder[i - 1]);
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

const showMenu = (menu) => {
    const foodMenu = document.getElementById('food-menu');
    const drinkMenu = document.getElementById('drink-menu');
    const switcherButtons = document.getElementsByClassName('switcher');
    const switcherIcon = document.getElementById('switcher-icon');

    if (menu === 'toggle'){
        menu = activeMenu === 'food' ? 'drinks' : 'food';
    }

    if (menu === activeMenu){
        return;
    }

    //toggle active class on switcher buttons
    for (let i = 0; i < switcherButtons.length; i++){
        switcherButtons[i].classList.toggle('active');
    }

    //hide/show appropriate menu
    drinkMenu.classList.toggle('menu-hidden');
    foodMenu.classList.toggle('menu-hidden');

    if (menu === 'food'){
        buildCategoryLinks(food);
        switcherIcon.innerText = 'wine_bar';
    }

    if (menu === 'drinks'){
        buildCategoryLinks(drinks);
        switcherIcon.innerText = 'restaurant';
    }

    //scroll the category rail to start
    const rail = document.getElementById('category-list-rail');
    rail.scrollTo({
        left: 0,
        behavior: 'auto',
    }) 
    
    //scroll to top
    window.scrollTo({
        top: 0,
        behavior: 'auto',
    })

    activeMenu = menu;
}