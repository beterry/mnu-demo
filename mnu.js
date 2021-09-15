let food = [];
let drink = [];
let allCategories = [];

let lastKnownScrollPosition = 0;
let scrollEventTicking = false;

//this is the default shown
let activeMenu = 'food';

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

//categories
const catCall = client.getEntries({'content_type': 'category'});

Promise.all([foodCall, drinkCall, catCall])
.then((res) => {

    //must organize categories before items
    organizeCategories(res[2]);

    //food
    organizeItems(res[0]);
    
    //drinks
    organizeItems(res[1]);
    
    //seperate allCategories into food and drinks
    seperateItems();
    console.log(food);
    console.log(drinks);
    
    //build menus to DOM
    buildMenu(food, 'food-menu');
    buildMenu(drinks, 'drink-menu');

    buildCategoryLinks(food);

    //reveal all data
    removeLoader();
})

//seperates food/drink items from Contentful into categories and adds them to the
//correct category
const organizeItems = (data) => {
    const items = data.items.map((item) => item.fields);
    let itemsSorted = [];

    items.forEach(item => {
        const i = allCategories.findIndex(cat => cat.category === item.categoryRef.fields.category);
        allCategories[i].items.push(item);
    })
}

//disects the contentful data into usable information
const organizeCategories = (data) => {

    //--1. distill the data to a usable object
    const allCategoriesUnsorted = data.items.map((cat) => {
        return {
            ...cat.fields,
            icon: cat.fields.icon.fields.file.url,
            items: [],
        }
    });

    //--2. sort the distilled categories by priority and assign to global variable
    allCategories = allCategoriesUnsorted.sort((a,b) => a.priority - b.priority);
}

const seperateItems = () => {
    drinks = allCategories.filter((cat => cat.type === "Drink"));
    food = allCategories.filter((cat => cat.type === "Food"));
}

const buildMenu = (items, htmlID) => {
    items.forEach(category => {
        const container = document.getElementById(htmlID);

        //section
        const section = document.createElement('section');
        section.id = category.category;
        section.classList.add('menu-section');
        
        //heading
        const sectionHeading = document.createElement('h2');
        sectionHeading.innerText = category.category;
        sectionHeading.classList.add('category-name');

        //description
        const sectionDescrip = document.createElement('p');
        sectionDescrip.innerText = category.description;
        sectionDescrip.classList.add('category-descrip');
        
        //items
        const list = document.createElement('ul');
        list.id = category.category;
        
        //loop through items in category
        category.items.forEach((item) => {
            const listItem = buildItem(item);
            
            //append menu item to list
            list.appendChild(listItem);
        })
        
        //append nodes to section
        section.appendChild(sectionHeading);
        category.description ? section.appendChild(sectionDescrip): null;
        section.appendChild(list);

        container.appendChild(section);
    })
}

const buildCategoryLinks = (categories) => {
    //clear the train
    const ulMenuCategories = document.getElementById("category-list-train");
    ulMenuCategories.innerHTML = "";

    categories.forEach(category => {
        const li = document.createElement('li');

        const button = document.createElement('button');
        button.addEventListener('click', (e) => {
            e.preventDefault();
            handleCategoryTapped(category.category)
        });
        button.id = `${category.category}-button`
        button.classList.add('category-button');

        const spanCategoryName = document.createElement('span');
        spanCategoryName.innerText = category.category;
        spanCategoryName.classList.add('category-link-name');

        const imgIcon = document.createElement('img');
        imgIcon.src = category.icon;
        imgIcon.alt = category.category;
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
        pItemDetails.classList.add('drink-info');
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
        pItemIngredients.classList.add('item-description')
        liItem.appendChild(pItemIngredients);
    }

    //price
    const pPrice = document.createElement('p');
    pPrice.classList.add('item-price');
    if (item.tapped){
        pPrice.innerText = 'Tapped';
    } else {
        pPrice.innerText = '$' + item.price.toFixed(2);
    }
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

    //add conditional classes to item
    if (item.tapped){
        liItem.classList.add('item-tapped');
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

    setFloatSwitcherHidden(false);

    //TODO: this is kinda hacky
    //after scrolling, allow scrolling event listeners again
    setTimeout(() => {
        scrollEventTicking = false;
    }, 1000);
}

const checkForScrollOverCategory = (scrollPos) => {
    const sectionGap = window.innerWidth > 768 ? 24 : 8;

    const i = allCategories.findIndex(category => {
        const viewStart = Math.round(scrollPos + sectionGap + categoryNavHeight);
        const sectionTop = Math.round(document.getElementById(category.category).offsetTop);

        return sectionTop > viewStart
    });

    if (scrollPos === 0){
        clearActiveCategory();
    }
    
    if (i > 0){
        setActiveCategory(allCategories[i - 1].category);
    }
}

const checkForScrollPastSwitcher = (scrollPos) => {
    const switcherSection = document.getElementById('menu-switcher');
    const floatSwitcher = document.getElementById('float-switcher-container');

    const posTrigger = switcherSection.offsetTop + switcherSection.offsetHeight;

    //check if user is past the switcher at the top
    if (scrollPos > posTrigger){
        setFloatSwitcherHidden(false)
    }else {
        setFloatSwitcherHidden(true);
    }
}

const setFloatSwitcherHidden = (bool) => {
    const floatSwitcher = document.getElementById('float-switcher-container');

    if (bool){
        floatSwitcher.classList.add('off-screen');
    }else{
        floatSwitcher.classList.remove('off-screen');
    }
}

document.addEventListener('scroll', () => {
    lastKnownScrollPosition = window.scrollY;

    if (!scrollEventTicking) {
        setTimeout(() => {
            checkForScrollOverCategory(lastKnownScrollPosition);
            checkForScrollPastSwitcher(lastKnownScrollPosition);
            scrollEventTicking = false;
        }, 500)
    }

    scrollEventTicking = true;
})

const showMenu = (menu) => {
    const foodMenu = document.getElementById('food-menu');
    const drinkMenu = document.getElementById('drink-menu');
    const switcherButtons = document.getElementsByClassName('switcher');
    const floatSwitcher = document.getElementById('float-switcher-container');

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
    }

    if (menu === 'drinks'){
        buildCategoryLinks(drinks);
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

    setFloatSwitcherHidden(true);

    activeMenu = menu;
}

const removeLoader = () => {
    const loaderContainer = document.getElementById('loader-container');
    loaderContainer.style.display = 'none';
}